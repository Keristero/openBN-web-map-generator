let {readdir,stat,readFile} = require('fs/promises')
const { resolve } = require('path')
let path = require('path')


class PrefabLoader{
    constructor(){

    }
    async LoadPrefabs(prefabs_directory){
        let files = await this.ListAllFiles(prefabs_directory)
        let prefab_paths = files.filter((item)=>{return path.extname(item) == ".json"})
        let prefab_objects = await this.LoadJsonFiles(prefab_paths)
        console.log(prefab_objects)
    }
    /**
     * 
     * @param {string} current_dir path to directory
     * @returns array of all files inside the directory and it's subfolders
     */
    async ListAllFiles(current_dir){
        let queue = [current_dir]
        let results = []
        while(queue.length > 0){
            let parent = queue.shift()
            let children = await readdir(parent,{withFileTypes:true})
            for(let child of children){
                let fileType = path.extname(child.name)
                let child_path = path.join(parent,child.name)
                if(fileType == ""){
                    queue.push(child_path)
                }else{
                    results.push(child_path)
                }
            }
        }
        return results
    }
    /**
     * Loads json files concurrently
     * @param {Array[string]} paths paths of json files to load
     * @returns array of named json data {name:'',data:{}}
     */
    async LoadJsonFiles(paths){
        let jsonObjectPromises = []
        let results = []
        for(let file_path of paths){
            let loadJsonPromise = new Promise(async (resolve,reject)=>{
                let file_name = path.basename(file_path)
                let json_string = await readFile(file_path,'utf-8')
                resolve({name:file_name,data:JSON.parse(json_string)})
            })
            jsonObjectPromises.push(loadJsonPromise)
        }
        results = await Promise.all(jsonObjectPromises)
        return results
    }
}

let testLoader = new PrefabLoader()

testLoader.LoadPrefabs('./')