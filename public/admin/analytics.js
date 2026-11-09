(function(){
"use strict";
var $=function(id){return document.getElementById(id)}, allowed=false;
function money(n){return "Rs "+Number(n||0).toLocaleString("en-PK")}
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function notice(message,error){var el=$("analyticsNotice");if(el){el.textContent=message;el.classList.toggle("error",!!error)}}
function defaults(){var end=new Date(),start=new Date();start.setDate(start.getDate()-29);$("analyticsStart").value=iso(start);$("analyticsEnd").value=iso(end)}
function safe(value){return String(value==null?"":value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
async function load(){
 if(!allowed)return;
 var start=$("analyticsStart").value,end=$("analyticsEnd").value;
 if(!start||!end||start>end){notice("Please choose a valid date range.",true);return}
 notice("Updating insights…");
 try{
  var q=new URLSearchParams({start:start,end:end,period:$("analyticsPeriod").value});
  var response=await fetch("/api/admin/analytics?"+q.toString(),{credentials:"same-origin",cache:"no-store"});
  var data=await response.json();if(!response.ok)throw new Error(data.error||"Could not load analytics.");
  var t=data.totals||{};
  $("analyticsRevenue").textContent=money(t.revenue_pkr);
  $("analyticsOrders").textContent=Number(t.total_orders||0).toLocaleString("en-PK");
  $("analyticsDelivered").textContent=Number(t.delivered_orders||0).toLocaleString("en-PK");
  $("analyticsDeliveredRevenue").textContent=money(t.delivered_revenue_pkr)+" delivered value";
  $("analyticsPending").textContent=Number(t.pending_orders||0).toLocaleString("en-PK");
  $("analyticsCancelled").textContent=Number(t.cancelled_orders||0).toLocaleString("en-PK")+" cancelled";
  renderTrend(data.trend||[]);renderProducts(data.top_products||[]);
  notice("Updated from all matching order records · "+start+" to "+end);
 }catch(e){notice(e.message,true)}
}
function renderTrend(rows){
 var el=$("analyticsChart");el.textContent="";
 if(!rows.length){el.innerHTML='<p class="empty">No orders in this date range.</p>';return}
 var max=Math.max(1,...rows.map(function(r){return Number(r.revenue_pkr||0)}));
 rows.forEach(function(r){
  var row=document.createElement("div");row.className="chart-row";
  var label=document.createElement("span");label.className="chart-label";label.textContent=r.bucket||"—";
  var track=document.createElement("div");track.className="chart-track";
  var fill=document.createElement("div");fill.className="chart-fill";fill.style.width=(Number(r.revenue_pkr||0)/max*100)+"%";track.appendChild(fill);
  var value=document.createElement("span");value.className="chart-value";value.textContent=money(r.revenue_pkr);
  row.append(label,track,value);el.appendChild(row);
 });
}
function renderProducts(rows){
 var body=$("analyticsProducts");body.textContent="";
 if(!rows.length){body.innerHTML='<tr><td colspan="3" class="empty">No product sales in this period.</td></tr>';return}
 rows.forEach(function(p){var tr=document.createElement("tr");var name=document.createElement("td");name.textContent=p.product_name+" · "+p.size_ml+"ml";var units=document.createElement("td");units.textContent=Number(p.units_sold||0).toLocaleString("en-PK");var revenue=document.createElement("td");revenue.textContent=money(p.revenue_pkr);tr.append(name,units,revenue);body.appendChild(tr)})
}
document.addEventListener("avz:session",function(event){
 var session=event.detail||{};
 fetch("/api/admin/session",{credentials:"same-origin",cache:"no-store"}).then(function(response){
  if(!response.ok)throw new Error("Session unavailable");
  return response.json();
 }).then(function(current){
  var permissions=current.permissions||session.permissions||[];
  allowed=!current.must_change_password&&permissions.indexOf("reports.read")!==-1;
  $("analyticsPanel").hidden=!allowed;
  if(allowed){if(!$("analyticsStart").value)defaults();load()}
 }).catch(function(){$("analyticsPanel").hidden=true;allowed=false});
});
$("analyticsApply").addEventListener("click",load);
$("analyticsRefresh").addEventListener("click",load);
$("analyticsPeriod").addEventListener("change",load);
})();
