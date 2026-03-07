async function getItems() {
  const res = await fetch("/api/items");
  return await res.json();
}

async function loanItem(id, friend) {
  await fetch("/api/loan", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({id, friend})
  });
  load();
}

async function returnItem(id) {
  await fetch("/api/return", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({id})
  });
  load();
}

async function removeItem(id) {
  await fetch("/api/items/"+id, {method:"DELETE"});
  load();
}

async function load() {
  const items = await getItems();

  const container = document.getElementById("inventory");
  container.innerHTML="";

  items.forEach(item => {

    const div=document.createElement("div");
    div.className="item";

    const title=document.createElement("span");
    title.innerText=item.name;

    div.appendChild(title);

    if(item.loanedTo){

      const loan=document.createElement("span");
      loan.innerText=" → "+item.loanedTo;
      loan.style.color="red";

      const returnBtn=document.createElement("button");
      returnBtn.innerText="Return";
      returnBtn.onclick=()=>returnItem(item.id);

      div.appendChild(loan);
      div.appendChild(returnBtn);

    } else {

      const input=document.createElement("input");
      input.placeholder="Friend";

      const loanBtn=document.createElement("button");
      loanBtn.innerText="Loan";
      loanBtn.onclick=()=>loanItem(item.id,input.value);

      div.appendChild(input);
      div.appendChild(loanBtn);

    }

    const remove=document.createElement("button");
    remove.innerText="Remove";
    remove.onclick=()=>removeItem(item.id);

    div.appendChild(remove);

    container.appendChild(div);
  });
}

load();