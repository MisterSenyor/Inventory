let config = null
let allItems = []
let collapsed = {}
let newTypeFieldsArray = []
let selectedType = null
let selectedFilterType = null; // currently selected type for filters
let selectedParentId = null

async function init(){

    config = await window.api.getConfig()

    loadTypes()
    loadClasses()

    renderFields()
    renderClassList()
    renderTypeList()
    renderClassCheckboxes()

    refresh()
}

function showTab(tab){

    document.getElementById("inventoryTab").style.display =
        tab === "inventory" ? "block" : "none"

    document.getElementById("borrowedTab").style.display =
        tab === "borrowed" ? "block" : "none"

    document.getElementById("settingsTab").style.display =
        tab === "settings" ? "block" : "none"
}

function loadTypes(){

    const select = document.getElementById("typeSelect")

    if(!select) return

    select.innerHTML = ""

    Object.keys(config.types).forEach(t => {

        const opt = document.createElement("option")

        opt.value = t
        opt.text = t

        select.appendChild(opt)
    })
}

function loadClasses(){

    const select = document.getElementById("classSelect")
    if(!select) return

    select.innerHTML = ""

    config.classes.forEach(c => {

        const opt = document.createElement("option")

        opt.value = c
        opt.text = c

        select.appendChild(opt)
    })
}

function renderFields(){

    const typeRaw = document.getElementById("typeSelect")
    if (!typeRaw) return
    const type = typeRaw.value

    const container = document.getElementById("dynamicFields")

    if(!container) return

    container.innerHTML = ""

    if(!config.types[type]) return

    const fields = config.types[type].fields

    fields.forEach(f => {

        const label = document.createElement("label")
        label.innerText = f.label + ": "

        const input = document.createElement("input")
        input.id = "field-" + f.name

        container.appendChild(label)
        container.appendChild(input)
        container.appendChild(document.createElement("br"))
    })
}

async function addItem(){
  const name = document.getElementById("itemName").value
  const cls = document.getElementById("classSearch").value
  const parent = document.getElementById("parentSearch").value || null
  if(!selectedType || !cls){
    alert("Please select a type")
    return
  }

  const fields = {}
  config.types[selectedType].fields.forEach(f=>{
    const input = document.getElementById("field-" + f.name)
    fields[f.name] = input ? input.value : ""
  })

  await window.api.addItem(
    name,
    selectedType,
    cls,
    fields,
    selectedParentId
  )

  // Clear inputs after adding
  document.getElementById("itemName").value = ""
  document.getElementById("typeSearch").value = ""
  document.getElementById("classSearch").value = ""
  document.getElementById("typeDynamicFields").innerHTML = ""
  selectedType = null
  selectedParentId = null

  refresh()
}

async function loanItem(id){

    const friendInput = document.getElementById("loan-"+id)

    if(!friendInput) return

    const friend = friendInput.value

    if(!friend) return

    await window.api.loanItem(id,friend)

    refresh()
}

async function returnItem(id){

    await window.api.returnItem(id)

    refresh()
}

function buildTree(items) {

    const itemMap = {}
    const roots = []

    // create lookup map and initialize children
    items.forEach(item => {
        itemMap[item.id] = { ...item, children: [] }
    })

    items.forEach(item => {

        const parentId = item.parent

        // parent exists in dataset → attach as child
        if (parentId && itemMap[parentId]) {
            itemMap[parentId].children.push(itemMap[item.id])
        }

        // parent missing or null → treat as root
        else {
            roots.push(itemMap[item.id])
        }
    })

    return roots
}

function renderTree(nodes, container, depth = 0, options = {}) {

    container.innerHTML = "";

    function renderNode(node, parentContainer, parentDepth) {

        const hasChildren = node.children && node.children.length > 0;

        const wrapper = document.createElement("div");
        wrapper.className = "tree-node";

        const card = document.createElement("div");
        card.className = "item-card";
        card.style.marginLeft = (parentDepth * 24) + "px";

        const info = document.createElement("div");
        info.className = "item-info";

        const titleRow = document.createElement("div");
        titleRow.className = "item-title";

        if (hasChildren) {

            const toggle = document.createElement("button");
            toggle.className = "toggle-btn";
            toggle.innerText = collapsed[node.id] ? "▶" : "▼";

            toggle.onclick = () => {
                collapsed[node.id] = !collapsed[node.id];
                refresh();
            };

            titleRow.appendChild(toggle);
        }

        const title = document.createElement("span");
        title.innerText = `${node.name} (${node.type})`;

        titleRow.appendChild(title);

        const fields = document.createElement("div");
        fields.className = "item-fields";

        fields.innerText = Object.entries(node.fields || {})
            .map(([k, v]) => `${k}: ${v}`)
            .join(" | ");

        info.appendChild(titleRow);
        info.appendChild(fields);

        const loanRow = document.createElement("div");

        if (options.showBorrowed) {

            const loanText = document.createElement("span");
            loanText.style.color = "red";
            loanText.innerText = `→ ${node.loanedTo}`;

            const returnBtn = document.createElement("button");
            returnBtn.innerText = "Return";
            returnBtn.onclick = () => returnItem(node.id);

            loanRow.appendChild(loanText);
            loanRow.appendChild(returnBtn);

        } else {

            if (node.loanedTo) {

                const loanText = document.createElement("span");
                loanText.style.color = "red";
                loanText.innerText = `→ ${node.loanedTo}`;

                loanRow.appendChild(loanText);

            } else {

                const loanInput = document.createElement("input");
                loanInput.placeholder = "Friend ID";
                loanInput.id = `loan-${node.id}`;

                const loanBtn = document.createElement("button");
                loanBtn.innerText = "Loan";
                loanBtn.onclick = () => loanItem(node.id);

                loanRow.appendChild(loanInput);
                loanRow.appendChild(loanBtn);
            }
        }

        info.appendChild(loanRow);

        const actions = document.createElement("div");
        actions.className = "item-actions";

        const editBtn = document.createElement("button");
        editBtn.innerText = "Edit";
        editBtn.onclick = () => showEdit(node);

        const removeBtn = document.createElement("button");
        removeBtn.innerText = "Remove";
        removeBtn.className = "remove-btn";
        removeBtn.onclick = () => removeItem(node.id);

        actions.appendChild(editBtn);
        actions.appendChild(removeBtn);

        card.appendChild(info);
        card.appendChild(actions);

        wrapper.appendChild(card);

        const childrenContainer = document.createElement("div");
        childrenContainer.className = "children-container";

        if (collapsed[node.id]) {
            childrenContainer.style.display = "none";
        }

        wrapper.appendChild(childrenContainer);

        if (
            options.showBorrowed ||
            (!options.showBorrowed &&
                (!node.loanedTo || (node.loanedTo && parentDepth !== 0)))
        ) {
            parentContainer.appendChild(wrapper);
        }

        if (hasChildren) {
            node.children.forEach(child =>
                renderNode(child, childrenContainer, parentDepth + 1)
            );
        }
    }

    nodes.forEach(node => renderNode(node, container, depth));
}

async function refresh(){
    let items = await filterInventory()
    console.log("ITEMS")
    console.log(items)
    const inventory = document.getElementById("inventoryList")
    const parentSelect = document.getElementById("parentSelect")

    if (inventory) {
        inventory.replaceChildren()
    }

    if(parentSelect){

        parentSelect.innerHTML = `<option value="">No Parent</option>`

        items.forEach(i=>{

            const opt = document.createElement("option")

            opt.value = i.id
            opt.text = i.name

            parentSelect.appendChild(opt)
        })
    }
    const tree = buildTree(items)
    renderTree(tree.filter(i => !i.loanedTo),inventory)
    refreshBorrowed()
}

async function refreshBorrowed() {
    const borrowed = document.getElementById("borrowedList")
    if (borrowed) {
        borrowed.replaceChildren()
    }
    items = await filterBorrowed()
    renderTree(buildTree(items), borrowed, 0, {showBorrowed: true});
}

async function addClass(){

    const input = document.getElementById("newClass")

    if(!input) return

    const name = input.value

    if(!name) return

    await window.api.addClass(name)

    config = await window.api.getConfig()

    loadClasses()

    renderClassList()

    input.value = ""
}

async function toggleNode(id, containerId) {
    console.log("GOT CALLED, ARGS ARE: " + id + ", " + containerId)
    collapsed[id] = !collapsed[id];
    const container = document.getElementById(containerId);
    if (!container) return;

    // decide which nodes to render based on container
    if (containerId === "inventoryList") {
        items = await window.api.getItems()
        renderTree(buildTree(items), container);
    } else if (containerId === "borrowedList") {
        items = await filterBorrowed()
        renderTree(buildTree(items), container, 0, {showBorrowed: true});
    }
}

async function addType(){

    const input = document.getElementById("newType")

    if(!input) return

    const name = input.value

    if(!name) return

    await window.api.addType(name)

    config = await window.api.getConfig()

    loadTypes()

    input.value = ""
}

function renderClassList(){

    console.log("CALLED RENDER")
    const list = document.getElementById("classList")

    list.innerHTML = ""

    console.log("CLASSES: " + config.classes)
    config.classes.forEach(c => {

        const div = document.createElement("div")

        div.innerHTML =
        `${c}
         <button type="button" onclick="removeClass('${c}')">Remove</button>`

        list.appendChild(div)
    })
}

async function removeClass(name){

    await window.api.removeClass(name)

    config = await window.api.getConfig()

    loadClasses()

    renderClassList()
}

async function removeItem(id){
    if (!await showConfirm("Remove this item?")) return
    await window.api.removeItem(id)

    refresh();
    setTimeout(() => document.body.focus(), 0)
}

function renderTypeList(){

    const list = document.getElementById("typeList")

    list.innerHTML = ""

    Object.keys(config.types).forEach(t => {

        const div = document.createElement("div")

        div.innerHTML =
        `${t}
         <button type="button" onclick="removeType('${t}')">Remove</button>`

        list.appendChild(div)
    })
}

function renderClassCheckboxes(){
  const container = document.getElementById("classCheckboxes")
  container.innerHTML = ""
  config.classes.forEach(c=>{
    const label = document.createElement("label")
    label.innerHTML = `<input type="checkbox" value="${c}" checked onchange="refresh()"> ${c}`
    container.appendChild(label)
    container.appendChild(document.createElement("br"))
  })
}

async function filterInventory() {
    const nameFilter = document.getElementById("mainSearch").value.toLowerCase();
    const checkedClasses = Array.from(document.querySelectorAll("#classCheckboxes input:checked")).map(cb => cb.value);
    const container = document.getElementById("typeFilterDynamicFields")
    const inputs = container.querySelectorAll("input")

    let items = await window.api.getItems();
    allItems = items

    console.log("PRE-FILTER:")
    console.log(items)

    let filters = {}
    inputs.forEach(input => {

        const field = input.dataset.field
        const value = input.value.trim().toLowerCase()

        if (value !== "") {
            filters[field] = value
        }

    })

    items = items.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(nameFilter);
        const classMatch = checkedClasses.includes(item.class);

        let typeMatch = !selectedFilterType || (selectedFilterType === "") || item.type === selectedFilterType
        let typeFieldMatch = true;
        if (selectedFilterType && item.type === selectedFilterType) {
            // Check each field filter
            console.log("FILTERING ON: " + item.id + ", FIELDS ARE")
            for (const [fieldName, filterVal] of Object.entries(filters)) {
                if (filterVal && !(filterVal === "") && (!item.fields[fieldName] || !item.fields[fieldName].toLowerCase().includes(filterVal))) {
                    typeFieldMatch = false;
                    break;
                }
            }
        }

        console.log("ITEM: " + item.name + ", MATCHES" + String(nameMatch) + String(classMatch) + String(typeMatch) + String(typeFieldMatch))

        return nameMatch && classMatch && typeMatch && typeFieldMatch;
    });
    console.log("FILTERED ITEMS: ")
    console.log(items)
    return items;
}

function updateParentSuggestions(){
  const val = document.getElementById("parentSearch").value.toLowerCase()
  const suggestions = allItems.filter(i => i.name.toLowerCase().includes(val))
  renderSuggestions(suggestions, "parent")
}

function updateTypeSuggestions(elemId){
  const val = document.getElementById(elemId + "Search").value.toLowerCase()
  if (val === "" && elemId === "typeFilter") {
    selectedFilterType = null
    refresh()
  }
  const suggestions = Object.keys(config.types).filter(t=>t.toLowerCase().includes(val))
  renderTypeSuggestions(suggestions, elemId)
}

function renderTypeSuggestions(suggestions, elemId){
  const container = document.getElementById(elemId + "Suggestions")
  console.log("ELEMID IS: " + elemId)
  container.innerHTML = ""
  suggestions.forEach(s=>{
    const div = document.createElement("div")
    div.innerText = s
    div.onclick = ()=>{
      document.getElementById(elemId + "Search").value = s
      if (elemId === "type") {
        selectedType = s  // <--- store selected type
      }
      else {
        selectedFilterType = s
      }
      container.innerHTML = ""
      refresh()
      renderDynamicFields(s, elemId)  // <--- generate fields for this type
    }
    container.appendChild(div)
  })
}

function renderDynamicFields(type, elemId){
  const container = document.getElementById(elemId + "DynamicFields")
  container.innerHTML = ""  // clear previous fields
  if (elemId === "typeFilter") typeFieldFilterValues = [];
  if(!config.types[type]) return

  const fields = config.types[type].fields

  fields.forEach(f=>{
    const label = document.createElement("label")
    label.innerText = f.label + ": "

    const input = document.createElement("input")
    input.id = "field-" + f.name
    input.placeholder = f.label
    input.dataset.field = f.name
    if (elemId === "typeFilter") {
    typeFieldFilterValues.push(f)
    input.oninput = () => {
        refresh();
    }
    }

    container.appendChild(label)
    container.appendChild(input)
    container.appendChild(document.createElement("br"))
  })
}

function updateClassSuggestions(){
  const val = document.getElementById("classSearch").value.toLowerCase()
  const suggestions = config.classes.filter(c=>c.toLowerCase().includes(val))
  renderSuggestions(suggestions, "class")
}

function renderSuggestions(suggestions, target){
  const container = document.getElementById(target+"Suggestions")
  container.innerHTML=""
  suggestions.forEach(s=>{
    const div = document.createElement("div")
    div.innerText = s.name || s
    div.onclick = ()=>{
      if(target==="parent") selectedParentId = s.id
      if(target==="type") document.getElementById("typeSearch").value = s
      if(target==="class") document.getElementById("classSearch").value = s
      container.innerHTML = ""
    }
    container.appendChild(div)
  })
}

function addFieldInput(){
  const container = document.getElementById("newTypeFields")
  const input = document.createElement("input")
  input.placeholder = "Field name"
  container.appendChild(input)
  newTypeFieldsArray.push(input)
}

async function createNewType(){
  const typeName = document.getElementById("newTypeName").value
  const fields = newTypeFieldsArray.map(i=>({name:i.value,label:i.value}))
  await window.api.addType({typeName, fields})
  config = await window.api.getConfig()
  renderTypeList()
  document.getElementById("newTypeName").value=""
  document.getElementById("newTypeFields").innerHTML=""
  newTypeFieldsArray=[]
}


function renderTypeFieldFilters(type) {
    const container = document.getElementById("typeFieldFilters");
    container.innerHTML = ""; // clear previous filters

    if (!config.types[type]) return;

    selectedFilterType = type;
    typeFieldFilterValues = {};

    config.types[type].fields.forEach(f => {
        const label = document.createElement("label");
        label.innerText = f.label + ": ";

        const input = document.createElement("input");
        input.placeholder = f.label;
        input.oninput = () => {
            typeFieldFilterValues[f.name] = input.value.toLowerCase();
            filterInventory(); // re-filter on input
        }

        container.appendChild(label);
        container.appendChild(input);
        container.appendChild(document.createElement("br"));
    });
}

async function filterBorrowed() {
    let friendFilter = document.getElementById("borrowedFriendSearch").value.toLowerCase();
    let itemFilter = document.getElementById("borrowedItemSearch").value.toLowerCase();
    let items = await window.api.getItems()
    items = items.filter(i => i.loanedTo); // only borrowed items

    items = items.filter(item => {
        const friendMatch = (friendFilter === "") || (item.loanedTo && item.loanedTo.toLowerCase().includes(friendFilter));
        const itemIdMatch = (itemFilter === "") || item.name.toLowerCase().includes(itemFilter);

        return friendMatch && itemIdMatch;
    });

    console.log(items)
    return items;
}

function showConfirm(message){
    return new Promise(resolve=>{

    const bg=document.createElement("div")
    bg.className="modal-bg"

    const box=document.createElement("div")
    box.className="modal-box"

    const text=document.createElement("p")
    text.innerText=message

    const ok=document.createElement("button")
    ok.innerText="Confirm"

    const cancel=document.createElement("button")
    cancel.innerText="Cancel"
    cancel.style.marginLeft="10px"

    ok.onclick=()=>{bg.remove();resolve(true)}
    cancel.onclick=()=>{bg.remove();resolve(false)}

    const btns=document.createElement("div")
    btns.className="modal-buttons"

    btns.appendChild(ok)
    btns.appendChild(cancel)

    box.appendChild(text)
    box.appendChild(btns)

    bg.appendChild(box)
    document.body.appendChild(bg)

    })
}

async function showEdit(item){

return new Promise(resolve=>{

const bg=document.createElement("div")
bg.className="modal-bg"

const box=document.createElement("div")
box.className="modal-box"

const title=document.createElement("h3")
title.innerText="Edit Item"

const nameInput=document.createElement("input")
nameInput.value=item.name
nameInput.style.width="100%"

box.appendChild(title)

box.appendChild(document.createTextNode("Name"))
box.appendChild(document.createElement("br"))
box.appendChild(nameInput)

const fieldInputs={}

Object.entries(item.fields||{}).forEach(([k,v])=>{

box.appendChild(document.createElement("br"))

const input=document.createElement("input")
input.value=v
input.style.width="100%"

box.appendChild(document.createTextNode(k))
box.appendChild(document.createElement("br"))
box.appendChild(input)

fieldInputs[k]=input

})

const save=document.createElement("button")
save.innerText="Save"

const cancel=document.createElement("button")
cancel.innerText="Cancel"
cancel.style.marginLeft="10px"

save.onclick=async()=>{

const fields={}

Object.keys(fieldInputs).forEach(k=>{
fields[k]=fieldInputs[k].value
})

await window.api.editItem(
item.id,
nameInput.value,
fields
)

bg.remove()
refresh()
resolve()

}

cancel.onclick=()=>{bg.remove();resolve()}

const btns=document.createElement("div")
btns.className="modal-buttons"

btns.appendChild(save)
btns.appendChild(cancel)

box.appendChild(btns)

bg.appendChild(box)

document.body.appendChild(bg)

})
}

init()