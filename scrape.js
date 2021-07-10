const { FeatureType, Web2DocScraper, AttributeType } = require('./web-to-document-scraper/main.js')
const fs = require('fs')
let testScraper = new Web2DocScraper()

async function scrape(url, outputPath, fromFile = false, trim = true) {
    //Set up attributes to scrape from page
    let required = true
    let attr_requiredTextContent = new AttributeType('textContent', 'text', required)
    let attr_optionalTextContent = new AttributeType('textContent', 'text')
    let attr_altText = new AttributeType('alt', 'text')
    let attr_requiredHref = new AttributeType('href', 'link', required)
    let attr_href = new AttributeType('href', 'link')
    let attr_src = new AttributeType('src', 'link')
    let attr_color = new AttributeType(undefined, 'color', false, 'color')
    let attr_background_color = new AttributeType(undefined, 'background-color', false, 'background-color')
    let attr_background_image = new AttributeType(undefined, 'background-image', false, 'background-image')

    //Add a feature for "Children", this will be any container type TAG, we add any of these tags to
    //the stack to create a deeply nested document
    let ChildFeature = new FeatureType(true, 'children', [attr_background_color, attr_color])
    let childTags = [
        'MAIN',
        'ASIDE',
        'ARTICLE',
        'HEADER',
        'HTML',
        'CENTER',
        'NAV',
        'BODY',
        'DIV',
        'SECTION',
        'SPAN',
        'UL',
        'LI',
        'TBODY',
        'TABLE',
        'TR',
        'TD',
        'B',
        'FONT',
    ]
    for (let tag of childTags) {
        testScraper.addFeatureType(tag, ChildFeature)
    }

    //Add a feature for "Links", which will also record the src or href link to the page
    let LinkFeature = new FeatureType(false, 'links', [attr_requiredTextContent, attr_requiredHref, attr_src])
    testScraper.addFeatureType('A', LinkFeature)

    //Add a feature for "Text", which will include the text content attribute
    let TextFeature = new FeatureType(false, 'text', [attr_requiredTextContent, attr_color])
    let textTags = ['H1', 'H2', 'H3', 'H4', 'P']
    for (let tag of textTags) {
        testScraper.addFeatureType(tag, TextFeature)
    }

    //Add paragraphs as a child feature which also has text
    let ChildFeatureWithText = new FeatureType(true, 'children', [attr_color])
    testScraper.addFeatureType('P', ChildFeatureWithText)

    //Add a feature for "Images", which will contain the image source and alt text as a description
    let ImageFeature = new FeatureType(false, 'images', [
        attr_src,
        attr_altText,
        attr_optionalTextContent,
        attr_background_image,
    ])
    testScraper.addFeatureType('IMG', ImageFeature)

    let res = await testScraper.scrape(url, fromFile, trim)
    fs.writeFileSync(outputPath, JSON.stringify(res, null, 2))
}

module.exports = scrape
