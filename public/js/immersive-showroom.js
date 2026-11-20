/* Avidezuri interactive showroom. Product PNGs are used as transparent textures,
   preserving the original bottle artwork while adding depth, parallax and rotation. */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

(function(){
  const hero=document.querySelector(".hero");
  const canvas=document.getElementById("immersive-canvas");
  if(!hero||!canvas)return;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderer,scene,camera,frame=0,raf=0,disposed=false;
  const pointer=new THREE.Vector2(0,0),target=new THREE.Vector2(0,0);
  const bottleGroups=[];
  const clock=new THREE.Clock();

  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
    renderer.setSize(hero.clientWidth,hero.clientHeight,false);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.12;
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(34,hero.clientWidth/hero.clientHeight,.1,100);
    camera.position.set(0,0,11);
    scene.add(new THREE.AmbientLight(0xffffff,1.5));
    const goldLight=new THREE.PointLight(0xd9b66f,34,22);goldLight.position.set(2,3,5);scene.add(goldLight);
    const greenLight=new THREE.PointLight(0x2c9470,18,20);greenLight.position.set(-4,-2,3);scene.add(greenLight);

    const archMat=new THREE.MeshBasicMaterial({color:0xc6a15b,transparent:true,opacity:.72});
    const arch=new THREE.Mesh(new THREE.TorusGeometry(3.65,.018,8,120,Math.PI*1.45),archMat);
    arch.position.set(1.45,.1,-1.5);arch.rotation.z=-.68;scene.add(arch);
    const innerArch=new THREE.Mesh(new THREE.TorusGeometry(2.95,.009,6,100,Math.PI*1.42),new THREE.MeshBasicMaterial({color:0xdcc58f,transparent:true,opacity:.32}));
    innerArch.position.set(1.45,.1,-1.6);innerArch.rotation.z=-.68;scene.add(innerArch);

    const particleCount=150,positions=new Float32Array(particleCount*3);
    for(let i=0;i<particleCount;i++){positions[i*3]=(Math.random()-.5)*13;positions[i*3+1]=(Math.random()-.5)*7;positions[i*3+2]=(Math.random()-.5)*5-1;}
    const particleGeo=new THREE.BufferGeometry();particleGeo.setAttribute("position",new THREE.BufferAttribute(positions,3));
    const particles=new THREE.Points(particleGeo,new THREE.PointsMaterial({color:0xe5c982,size:.025,transparent:true,opacity:.7,depthWrite:false}));
    scene.add(particles);

    const loader=new THREE.TextureLoader();
    const specs=[
      {src:"/images/de-marj.png",x:1.35,y:-.15,z:1,w:2.9,main:true},
      {src:"/images/de-ignite-oud.png",x:3.55,y:-.65,z:-1.3,w:1.48,opacity:.84},
      {src:"/images/de-summer-oud.png",x:4.65,y:-.78,z:-2.0,w:1.22,opacity:.72}
    ];
    specs.forEach((spec,index)=>{
      loader.load(spec.src,(texture)=>{
        if(disposed){texture.dispose();return;}
        texture.colorSpace=THREE.SRGBColorSpace;
        const image=texture.image,ratio=image.width/image.height;
        const group=new THREE.Group();
        const h=spec.w/ratio;
        const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:spec.opacity||1,depthWrite:false,side:THREE.DoubleSide});
        const mesh=new THREE.Mesh(new THREE.PlaneGeometry(spec.w,h),mat);
        group.add(mesh);
        // A subtle dark-gold halo sits behind the untouched bottle image.
        if(spec.main){
          const halo=new THREE.Mesh(new THREE.CircleGeometry(1.65,64),new THREE.MeshBasicMaterial({color:0xc6a15b,transparent:true,opacity:.10,depthWrite:false}));
          halo.position.z=-.08;group.add(halo);
        }
        group.position.set(spec.x,spec.y,spec.z);
        group.userData={baseX:spec.x,baseY:spec.y,main:!!spec.main,phase:index*1.7};
        scene.add(group);bottleGroups.push(group);
      },undefined,()=>{});
    });

    function resize(){
      if(!renderer||!camera)return;
      const w=hero.clientWidth,h=hero.clientHeight;
      renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
      const mobile=w<820;
      camera.position.set(mobile?0:.35,mobile?-.45:0,mobile?13:11);
      camera.fov=mobile?39:34;camera.updateProjectionMatrix();
      bottleGroups.forEach((g)=>{const main=g.userData.main;g.userData.baseX=mobile?(main?.05:main?0:g.userData.baseX):(main?1.35:g.userData.baseX);});
    }
    function move(e){
      const r=canvas.getBoundingClientRect();
      target.x=((e.clientX-r.left)/r.width-.5)*2;
      target.y=-((e.clientY-r.top)/r.height-.5)*2;
    }
    canvas.addEventListener("pointermove",move,{passive:true});
    canvas.addEventListener("pointerleave",()=>{target.set(0,0);},{passive:true});
    const observer=new ResizeObserver(resize);observer.observe(hero);
    resize();
    hero.classList.add("showroom-ready");

    function render(){
      if(disposed)return;
      raf=requestAnimationFrame(render);
      const t=clock.getElapsedTime();
      pointer.lerp(target,.055);
      camera.position.x=(reduced?0:pointer.x*.28);
      camera.position.y=(reduced?0:pointer.y*.16)+(hero.clientWidth<820?-.45:0);
      camera.lookAt(hero.clientWidth<820?0:1.15,hero.clientWidth<820?-.15:0,0);
      bottleGroups.forEach((g)=>{
        const d=g.userData,main=d.main;
        const floatY=reduced?0:Math.sin(t*1.05+d.phase)*.075;
        g.position.y=d.baseY+floatY+(main?pointer.y*.12:pointer.y*.05);
        g.rotation.y=(main?pointer.x*.25:pointer.x*.12)+(reduced?0:Math.sin(t*.42+d.phase)*.035);
        g.rotation.x=main?-pointer.y*.08:0;
        if(main&&!reduced)g.rotation.z=Math.sin(t*.5)*.012;
      });
      particles.rotation.y=reduced?0:t*.012;
      renderer.render(scene,camera);
    }
    render();
    document.addEventListener("visibilitychange",()=>{if(document.hidden){cancelAnimationFrame(raf);}else if(!disposed)render();});
    window.addEventListener("pagehide",()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();renderer.dispose();},{once:true});
  }catch(error){
    console.warn("Avidezuri 3D showroom unavailable; using the standard hero image.",error);
    hero.classList.remove("showroom-ready");
    if(renderer)renderer.dispose();
    canvas.hidden=true;
  }
})();