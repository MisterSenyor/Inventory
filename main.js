const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const store = require("./inventoryStore")

function createWindow(){

    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences:{
            preload: path.join(__dirname,"preload.js")
        }
    })

    win.loadFile("index.html")
    win.webContents.openDevTools();
}

app.whenReady().then(createWindow)

ipcMain.handle("getItems", () => store.getItems())

ipcMain.handle("getConfig", () => store.getConfig())

ipcMain.handle("addItem",(e,name,type,cls,fields,parent) => {
    console.log("MAIN - PARENT IS: " + parent)
    store.addItem(name,type,cls,fields,parent)
    }
)

ipcMain.handle("loanItem",(e,id,friend) =>
    store.loanItem(id,friend)
)

ipcMain.handle("returnItem",(e,id) =>
    store.returnItem(id)
)

ipcMain.handle("removeItem",(e,id)=>
    store.removeItem(id)
)

ipcMain.handle("addClass",(e,name) =>
    store.addClass(name)
)

ipcMain.handle("removeClass",(e,name)=>
    store.removeClass(name)
)

ipcMain.handle("removeType",(e,name)=>
    store.removeType(name)
)

ipcMain.handle("addType", (e,data)=>{
  store.addType(data.typeName, data.fields)
})