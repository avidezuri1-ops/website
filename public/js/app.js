/* ===== EDIT THIS SECTION ===== */
var CONFIG = {
  currency: "Rs ",               // shown before every price
  whatsapp: "923181230098",      // digits only with country code (92 = Pakistan, leading 0 dropped)
  sizes: ["30 ml", "50 ml", "100 ml"],
  zones: [                       // delivery fee by Karachi area; move areas between fees or edit the fees freely
    { fee: 200, areas: ["Saddar", "Clifton", "DHA (Defence)", "PECHS", "Tariq Road", "Gulshan-e-Iqbal", "Gulistan-e-Jauhar", "North Nazimabad", "Nazimabad", "Federal B Area", "Garden", "Bahadurabad"] },
    { fee: 300, areas: ["Korangi", "Landhi", "Malir", "Shah Faisal Colony", "Scheme 33", "Gulshan-e-Maymar", "North Karachi", "New Karachi", "Orangi Town", "SITE", "Liaquatabad", "Lyari", "Baldia", "Keamari"] },
    { fee: 400, areas: ["Bin Qasim", "Steel Town", "Gadap", "Surjani Town", "Hawksbay", "Manghopir", "Bahria Town Karachi", "DHA City", "Gulshan-e-Hadeed", "Other area in Karachi"] }
  ],
  prices: [1450, 1750, 2250],    // Budget Friendly prices: 30 ml, 50 ml, 100 ml
  products: [                    // add or remove names here; one per line
    "DE WANTED",
    "DE NIGHT",
    "DE FLORA",
    "DE SWIM",
    "DE CREVENTUS",
    "DE MOVEMENT",
    "DE ANGEL",
    "DE ALEE’SHA",
    "DE BOMB",
    "DE OCEAN",
    "IN DE SEA",
    "DE SAV WILD",
    "DE TRUE BOND",
    "DE AQUA",
    "DE CRISTAL ROUGE",
    "DE DESIRE",
    "DE WOMEN",
    "DE LEATHER",
    "DE FANTASY",
    "DE MOUNTAIN",
    "DE BLACK",
    "DE NOIR"
    // To give one perfume its own prices or bottle colour:
    // { name: "DE EXAMPLE", prices: [1500, 2000, 3300], color: "#8e2f45", image: "images/my-photo.jpg" }
  ]
};
/* ===== END EDIT SECTION ===== */

var PALETTE = ["#c8872b", "#c46a7b", "#3f8fb5", "#6f8a4f", "#7a5aa6", "#cdb77a", "#8e2f45", "#2f8f86"];
var EXCLUSIVE_PRODUCTS = [
  "DE ANGEL", "DE DESIRE", "DE NIGHT", "DE AQUA", "DE WOMEN", "DE MOUNTAIN",
  "DE CRISTAL ROUGE", "DE ALEE’SHA", "DE FANTASY", "DE SWIM", "DE BLACK", "DE NOIR"
];
var EXCLUSIVE_PRICES = [1750, 2250, 3200];
function productKey(n){
  return String(n).toLowerCase().replace(/[^a-z0-9]/g, "");
}
var exclusiveKeys = EXCLUSIVE_PRODUCTS.map(productKey);
CONFIG.products = CONFIG.products.map(function(p, i){
  if(typeof p === "string") p = { name: p };
  p.category = p.category || (exclusiveKeys.indexOf(productKey(p.name)) >= 0 ? "exclusive" : "budget");
  p.prices = p.prices || (p.category === "exclusive" ? EXCLUSIVE_PRICES : CONFIG.prices);
  p.color = p.color || PALETTE[i % PALETTE.length];
  return p;
});

var qty = CONFIG.products.map(function(){ return CONFIG.sizes.map(function(){ return 0; }); });
var sel = CONFIG.products.map(function(){ return 0; });
var cards = [];
var activeCategory = "all";
var fee = 0, area = "";
var $ = function(id){ return document.getElementById(id); };
function money(n){ return CONFIG.currency + Math.round(n).toLocaleString("en-US"); }
function el(tag, cls, text){
  var e = document.createElement(tag);
  if(cls) e.className = cls;
  if(text !== undefined) e.textContent = text;
  return e;
}

function bottle(color, w){
  return '<svg viewBox="0 0 80 120"' + (w ? ' width="' + w + '"' : '') + ' aria-hidden="true">' +
    '<rect class="cap" x="31" y="3" width="18" height="15" rx="3"/>' +
    '<rect class="cap" x="36" y="17" width="8" height="9"/>' +
    '<rect class="glass" x="13" y="26" width="54" height="90" rx="15"/>' +
    '<rect x="18" y="54" width="44" height="57" rx="10" fill="' + color + '"/>' +
    '<rect class="label" x="26" y="70" width="28" height="22" rx="2"/>' +
    '<rect class="shine" x="21" y="32" width="5" height="76" rx="2.5"/></svg>';
}

function slug(n){
  return n.toLowerCase().replace(/[\u2019']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* Looks for images/<perfume-name>.jpg (or png, webp, jpeg). If none is found, the bottle drawing stays. */
function tryPhoto(art, p){
  var base = p.image || "images/" + slug(p.name);
  var exts = p.image ? [""] : ["jpg", "png", "webp", "jpeg"];
  var k = 0;
  (function next(){
    if(k >= exts.length) return;
    var img = new Image();
    img.alt = p.name;
    img.onload = function(){ art.textContent = ""; art.appendChild(img); art.classList.add("photo"); };
    img.onerror = function(){ k++; next(); };
    img.src = exts[k] ? base + "." + exts[k] : base;
  })();
}

function renderShelf(){
  var s = $("shelf");
  [["30 ml", 52], ["50 ml", 70], ["100 ml", 94]].forEach(function(b){
    var f = el("figure");
    f.innerHTML = bottle("#c8872b", b[1]);
    f.appendChild(el("figcaption", "", b[0]));
    s.appendChild(f);
  });
}

function renderZones(){
  var all = [];
  CONFIG.zones.forEach(function(z){ z.areas.forEach(function(a){ all.push({ name: a, fee: z.fee }); }); });
  all.sort(function(x, y){
    var ox = /^Other/.test(x.name), oy = /^Other/.test(y.name);
    return ox !== oy ? (ox ? 1 : -1) : x.name.localeCompare(y.name);
  });
  all.forEach(function(a){ var o = el("option", "", a.name); o.value = a.name; o.dataset.fee = a.fee; $("f-area").appendChild(o); });
}

function renderList(){
  var list = $("list");
  list.textContent = "";
  CONFIG.products.forEach(function(p, i){
    var card = el("div", "card");
    card.style.setProperty("--card-index", i);
    card.dataset.s = p.name.toLowerCase();
    card.dataset.category = p.category;
    var art = el("div", "art");
    art.style.setProperty("--tint", p.color);
    art.innerHTML = bottle(p.color);
    tryPhoto(art, p);
    var body = el("div", "body");
    body.appendChild(el("div", "cname", p.name));
    var pills = el("div", "pills");
    pills.setAttribute("role", "group");
    pills.setAttribute("aria-label", "Size for " + p.name);
    var pb = CONFIG.sizes.map(function(sz, j){
      var b = el("button", "pill", sz.replace(" ml", ""));
      b.type = "button";
      b.setAttribute("aria-label", sz);
      b.appendChild(el("i"));
      b.onclick = function(){ sel[i] = j; refresh(i); };
      pills.appendChild(b);
      return b;
    });
    var price = el("div", "cprice");
    var st = el("div", "stepper");
    var minus = el("button", "", "−"); minus.type = "button"; minus.setAttribute("aria-label", "Remove one " + p.name);
    var out = el("output");
    var plus = el("button", "", "+"); plus.type = "button"; plus.setAttribute("aria-label", "Add one " + p.name);
    minus.onclick = function(){ change(i, -1); };
    plus.onclick = function(){ change(i, 1); };
    st.appendChild(minus); st.appendChild(out); st.appendChild(plus);
    body.appendChild(pills); body.appendChild(price); body.appendChild(st);
    card.appendChild(art); card.appendChild(body);
    list.appendChild(card);
    cards.push({ el: card, art: art, pills: pb, price: price, out: out, category: p.category });
    refresh(i);
  });
}

function refresh(i){
  var c = cards[i], j = sel[i];
  c.art.dataset.z = j;
  c.pills.forEach(function(b, k){
    b.setAttribute("aria-pressed", k === j ? "true" : "false");
    var badge = b.lastChild, q = qty[i][k];
    badge.textContent = q || "";
    badge.hidden = !q;
  });
  c.price.textContent = CONFIG.sizes[j] + " · " + money(CONFIG.products[i].prices[j]);
  c.out.textContent = qty[i][j];
}

function change(i, d){
  var j = sel[i];
  qty[i][j] = Math.max(0, Math.min(20, qty[i][j] + d));
  refresh(i);
  renderSummary();
}

function each(fn){
  CONFIG.products.forEach(function(p, i){
    CONFIG.sizes.forEach(function(sz, j){ if(qty[i][j]) fn(p, sz, qty[i][j], p.prices[j] * qty[i][j]); });
  });
}

function total(){
  var t = 0;
  each(function(p, sz, n, line){ t += line; });
  return t;
}

function renderSummary(){
  var ul = $("summary"), count = 0;
  ul.textContent = "";
  each(function(p, sz, n, line){
    count += n;
    var li = el("li");
    li.appendChild(el("span", "", n + " × " + p.name + " (" + sz + ")"));
    li.appendChild(el("span", "", money(line)));
    ul.appendChild(li);
  });
  if(!count) ul.appendChild(el("li", "empty", "Nothing selected yet. Add a perfume above."));
  var o = $("f-area").selectedOptions[0];
  area = o && o.dataset.fee ? o.value : "";
  fee = count && area ? +o.dataset.fee : 0;
  if(count){
    var sh = el("li", "ship");
    sh.appendChild(el("span", "", "Delivery" + (area ? " · " + area : "")));
    sh.appendChild(el("span", "", area ? money(fee) : "Choose your area"));
    ul.appendChild(sh);
  }
  $("total").textContent = money(total() + fee);
  $("bar").hidden = !count;
  $("bar-n").textContent = count + (count === 1 ? " item · " : " items · ") + money(total());
}

function buildMessage(){
  var lines = ["New order – Avidezuri", "", "Items:"];
  each(function(p, sz, n, line){
    lines.push("- " + n + " × " + p.name + " (" + sz + ") – " + money(line));
  });
  lines.push("", "Subtotal: " + money(total()), "Delivery (" + area + "): " + money(fee), "Total: " + money(total() + fee) + " (cash on delivery)", "",
    "Name: " + $("f-name").value.trim(),
    "Phone: " + $("f-phone").value.trim(),
    "Area: " + area + ", Karachi",
    "Address: " + $("f-addr").value.trim());
  var notes = $("f-notes").value.trim();
  if(notes) lines.push("Notes: " + notes);
  return lines.join("\n");
}

function check(){
  var m = $("msg");
  m.className = "msg err";
  if(total() === 0){ m.textContent = "Add at least one perfume to your order."; return false; }
  var fields = [["f-name", "your name"], ["f-phone", "your phone number"], ["f-addr", "your delivery address"]];
  var missing = fields.filter(function(f){
    var empty = !$(f[0]).value.trim();
    $(f[0]).setAttribute("aria-invalid", empty ? "true" : "false");
    return empty;
  });
  if(missing.length){
    var w = missing.map(function(f){ return f[1]; });
    var text = w.length === 1 ? w[0] : w.length === 2 ? w[0] + " and " + w[1] : w[0] + ", " + w[1] + ", and " + w[2];
    m.textContent = "Please enter " + text + ".";
    $(missing[0][0]).focus();
    return false;
  }
  if($("f-phone").value.replace(/\D/g, "").length < 7){
    $("f-phone").setAttribute("aria-invalid", "true");
    m.textContent = "Please enter a valid phone number.";
    $("f-phone").focus();
    return false;
  }
  if(!area){
    $("f-area").setAttribute("aria-invalid", "true");
    m.textContent = "Please choose your delivery area in Karachi.";
    $("f-area").focus();
    return false;
  }
  m.className = "msg"; m.textContent = "";
  return true;
}

["f-name", "f-phone", "f-addr"].forEach(function(id){
  $(id).oninput = function(){ this.setAttribute("aria-invalid", "false"); };
});

$("f-area").onchange = function(){ this.setAttribute("aria-invalid", "false"); renderSummary(); };

$("send-wa").onclick = function(){
  if(!CONFIG.whatsapp){ $("msg").className = "msg err"; $("msg").textContent = "WhatsApp number not set yet."; return; }
  if(!check()) return;
  window.open("https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(buildMessage()), "_blank");
};

function applyFilters(){
  var q = $("find").value.trim().toLowerCase(), shown = 0;
  cards.forEach(function(c){
    var categoryMatch = activeCategory === "all" || c.category === activeCategory;
    var searchMatch = !q || c.el.dataset.s.indexOf(q) >= 0;
    c.el.hidden = !(categoryMatch && searchMatch);
    if(!c.el.hidden) shown++;
  });
  var none = $("none");
  none.textContent = q ? "No perfumes match your search in this category." :
    activeCategory === "exclusive" ? "No exclusive perfumes found." :
    activeCategory === "budget" ? "No budget-friendly perfumes found." :
    "No perfumes found.";
  none.hidden = shown > 0;
}

Array.prototype.forEach.call(document.querySelectorAll(".category-btn"), function(button){
  button.onclick = function(){
    activeCategory = button.dataset.category;
    Array.prototype.forEach.call(document.querySelectorAll(".category-btn"), function(b){
      b.setAttribute("aria-pressed", b === button ? "true" : "false");
    });
    applyFilters();
  };
});

$("find").oninput = applyFilters;

$("yr").textContent = new Date().getFullYear();
renderZones();
renderList();
renderSummary();
