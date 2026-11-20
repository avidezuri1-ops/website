/* Interactive depth and bottle response for every catalogue card and new arrival.
   The original transparent product PNGs are retained exactly as supplied. */
(function(){
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse=window.matchMedia&&window.matchMedia("(hover: none)").matches;
  if(reduce||coarse)return;
  function attach(card){
    if(card.dataset.depthReady==="1")return;
    card.dataset.depthReady="1";
    var rect;
    function move(event){
      rect=rect||card.getBoundingClientRect();
      var x=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
      var y=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
      var ry=(x-.5)*13,rx=(.5-y)*10;
      card.style.setProperty("--tilt-x",rx.toFixed(2)+"deg");
      card.style.setProperty("--tilt-y",ry.toFixed(2)+"deg");
      card.style.setProperty("--light-x",(x*100).toFixed(1)+"%");
      card.style.setProperty("--light-y",(y*100).toFixed(1)+"%");
      card.classList.add("is-tilting");
    }
    function reset(){
      rect=null;
      card.style.setProperty("--tilt-x","0deg");
      card.style.setProperty("--tilt-y","0deg");
      card.style.setProperty("--light-x","50%");
      card.style.setProperty("--light-y","35%");
      card.classList.remove("is-tilting");
    }
    card.addEventListener("pointerenter",function(){rect=card.getBoundingClientRect();},{passive:true});
    card.addEventListener("pointermove",move,{passive:true});
    card.addEventListener("pointerleave",reset,{passive:true});
    card.addEventListener("pointercancel",reset,{passive:true});
  }
  function scan(root){
    (root||document).querySelectorAll("#shop .card,.new-arrival-card").forEach(attach);
  }
  scan();
  var list=document.getElementById("list");
  var arrivals=document.getElementById("new-arrivals-track");
  if("MutationObserver" in window){
    [list,arrivals].filter(Boolean).forEach(function(node){
      new MutationObserver(function(){scan(node);}).observe(node,{childList:true,subtree:true});
    });
  }
  window.addEventListener("resize",function(){document.querySelectorAll("#shop .card,.new-arrival-card").forEach(function(card){card.style.setProperty("--tilt-x","0deg");card.style.setProperty("--tilt-y","0deg");});},{passive:true});
})();