const fs = require("fs")
const path = require("path")

const DATA = path.join(__dirname,"inventory.json")
const CONFIG = path.join(__dirname,"config.json")

function read(file){
    return JSON.parse(fs.readFileSync(file))
}

function write(file,data){
    fs.writeFileSync(file,JSON.stringify(data,null,2))
}

function getItems(){
    return read(DATA)
}

function getConfig(){
    return read(CONFIG)
}

function addClass(name){

    const cfg = read(CONFIG)

    if(!cfg.classes.includes(name))
        cfg.classes.push(name)

    write(CONFIG,cfg)
}

function removeClass(name){

    const cfg = read(CONFIG)

    cfg.classes = cfg.classes.filter(c => c !== name)

    write(CONFIG,cfg)
}


function removeType(name){

    const cfg = read(CONFIG)

    delete cfg.types[name]

    write(CONFIG,cfg)
}

function removeItem(id) {
    let items = read(DATA)
    console.log("ITEM ID IS: " + id)
    items = items.filter(item => item.id !== id)

    write(DATA, items)
}

function addItem(name,type,cls,fields,parent){

    const items = read(DATA)
    const item = {
        id:"ITEM-"+Date.now(),
        name,
        type,
        class:cls,
        fields,
        parent: parent || null,
        loanedTo:null
    }

    items.push(item)

    write(DATA,items)

    return item
}

function getChildren(items,parentId){

    return items.filter(i => i.parent === parentId)
}

function loanItem(id,friend){

    const items = read(DATA)

    function loanRecursive(itemId){

        const item = items.find(i => i.id === itemId)

        if(!item) return

        item.loanedTo = friend

        const children = getChildren(items,itemId)

        children.forEach(c => loanRecursive(c.id))
    }

    loanRecursive(id)

    write(DATA,items)
}

function returnItem(id){

    const items = read(DATA)

    const item = items.find(i => i.id === id)

    if(item) item.loanedTo = null

    write(DATA,items)
}

function addType(name, fields){
  const cfg = read(CONFIG)
  cfg.types[name] = {fields: fields.length ? fields : [{name:"id",label:"ID"}]}
  write(CONFIG, cfg)
}

module.exports={
    getItems,
    getConfig,
    addClass,
    removeClass,
    addType,
    removeType,
    removeItem,
    addItem,
    loanItem,
    returnItem
}