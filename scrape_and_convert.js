const path = require('path')
const fs = require('fs')

const {writeFile} = require('fs/promises')
const scraper = require('./web-to-document-scraper/scraper.js')
const {cull_unwanted_nodes} = require('./web-to-document-scraper/helpers')
const {loadImage } = require('canvas')
const e = require('express')

const minimum_importance = 1
const tag_blacklist = ["SCRIPT","STYLE"]

var duplicate_links = {}
var duplicate_images = {}

//collections and the attributes which are sorted into them
//the order of this collection is also the priority
//if a node has any attribute of the collection, it will return early with that collection type
const collection_attribute_identifiers = {
    images:["src","background-image"],
    links:["href"],
    text:["text"]
}

function create_or_add_to_feature(target_feature,feature_name,feature){
    if(!target_feature.features){
        target_feature.features = {}
    }
    if(!target_feature.features[feature_name]){
        target_feature.features[feature_name] = []
    }
    target_feature.features[feature_name].push(feature)
}

function detect_feature_type(node){
    //detect which collection the node falls into
    for(let collection_name in collection_attribute_identifiers){
        for(let key in node){
            if(key === "parent" || key === "children"){
                continue
            }
            let attributes = collection_attribute_identifiers[collection_name]
            if(attributes.includes(key)){
                return collection_name
            }
        }
    }
    //if the feature does not fit into any other category, it is just a child
    return 'children'
}

function get_url_obj_if_valid(string) {
    try {
        return new URL(string);
    } catch (_) {
        return null;
    }
}

async function parse_feature_attributes(feature_collection,node){
    //grab any additional information from the node that we want to keep for the final converted document
    let feature = {}
    //firstly, things that all feature types share
    if(node["tag"]){
        feature["tag"] = node.tag
    }

    if(feature_collection === "images"){
        if(node["src"]){
            feature["src"] = node.src
        }
        if(node["alt"]){
            feature["alt"] = node.alt
        }
        if(node["background-image"]){
            let background_image_url = node["background-image"].slice(4, -1).replace(/"/g, "");
            feature["src"] = background_image_url
        }
        //delete conditions
        if(/ar-gradient/.test(feature["src"])){
            feature.should_be_deleted = true
        }
        try{
            if(!duplicate_images[feature.src]){
                feature.data = await loadImage(feature.src)
                duplicate_images[feature.src] = feature.data
            }else{
                feature.data = duplicate_images[feature.src]
            }
        }catch(e){
            feature.should_be_deleted = true
        }
    }
    if(feature_collection === "links"){
        if(node["href"]){
            feature["href"] = node.href
        }
        if(node["text"]){
            feature["text"] = node.text
        }
        let url = get_url_obj_if_valid(feature["href"])
        if(url){
            //if there is no descripton for the link, default it to the url path if we have one
            if(!feature["text"] && url.pathname){
                feature["text"] = url.pathname
            }
            if(!feature["text"] && url.hostname){
                feature["text"] = url.hostname
            }
        }
        //if the description is too long, shorten it
        let max_length = 40
        if(feature["text"].length > max_length){
            feature["text"] = feature["text"].slice(feature["text"].length-max_length,max_length)
        }


        //delete conditions
        if(!url){
            feature.should_be_deleted = true
        }else{
            if(!(url.protocol === "http:" || url.protocol === "https:")){
                feature.should_be_deleted = true
            }
        }
        if(duplicate_links[feature["href"]]){
            //delete any links that are duplicates
            feature.should_be_deleted = true
        }else{
            //record any links that are not duplicates
            duplicate_links[feature["href"]] = true
        }
    }
    if(feature_collection === "text"){
        if(node["text"]){
            feature["text"] = node.text
        }
        //delete conditions
        if(feature["text"].length < 32){
            feature.should_be_deleted = true
        }
        if(/<\/?[a-z][\s\S]*>/i.test(feature["text"])){
            feature.should_be_deleted = true
        }
    }
    if(feature_collection === "children"){
        if(node["background-color"]){
            feature["background-color"] = node["background-color"]
        }
    }
    return feature
}

async function scrape(url, outputPath) {
    let document = await scraper(url)
    document = cull_unwanted_nodes(document,tag_blacklist,minimum_importance)
    //expected output
    let example = {
        features:{
            children:[],
            images:[
                {
                    text:"",
                    link:""
                }
            ],
            links:[
                {
                    text:"",
                    link:""
                }
            ]
        }
    }

    let converted_document = {}
    let queue = [document]
    duplicate_links = {}
    while(queue.length > 0){
        let node = queue.shift()
        for(let child of node.children){
            queue.push(child)
        }
        if(node.parent){
            let feature_collection_name = detect_feature_type(node)
            if(feature_collection_name != 'children'){
                //if this feature is not a child, make sure all its children will be added to this nodes parents
                //rather than to this node (which will be something else like a image feature for example)
                for(let childb of node.children){
                    childb.parent = node.parent
                }
            }
            //now grab all the important information for this feature type from the node
            let feature = await parse_feature_attributes(feature_collection_name,node)
            node.converted_node = feature
            //add the newly generated feature to the parent of this node
            if(!feature.should_be_deleted){
                //only add features to the parent node of they dont suck
                create_or_add_to_feature(node.parent.converted_node,feature_collection_name,feature)
            }
        }else{
            //if this node has no parent, it must be the root feature
            let feature = await parse_feature_attributes("root",node)
            node.converted_node = feature
            converted_document = feature
        }
    }

    //save converted document
    writeFile(outputPath, JSON.stringify(converted_document, null, 1))
    return converted_document
}

module.exports = scrape
