diff --git a/script.js b/script.js
index 9ea73c30d6a23cc990024aa3381305c3a35da2f1..bfc76ac3fbd36268cbfae9c844edff864ea7bdde 100644
--- a/script.js
+++ b/script.js
@@ -45,50 +45,55 @@
   const sfx = {};
   function loadSfx(name, url) {
     const a = new THREE.Audio(listener);
     const loader = new THREE.AudioLoader();
     loader.load(url, (buffer) => { a.setBuffer(buffer); a.setVolume(0.6); });
     sfx[name] = a;
   }
   // You can add real files later; these are optional
   loadSfx('tick', 'assets/audio/sfx_wheel_tick.ogg');
   loadSfx('hiss', 'assets/audio/sfx_valve_hiss.ogg');
   loadSfx('latch', 'assets/audio/sfx_latch.ogg');
   loadSfx('scope', 'assets/audio/sfx_scope_click.ogg');
   loadSfx('key', 'assets/audio/sfx_key_in.ogg');
 
   muteBtn.addEventListener('click', () => {
     audioEnabled = !audioEnabled;
     muteBtn.textContent = audioEnabled ? 'Audio' : 'Muted';
   });
   function play(name, vol=1.0, rate=1.0) {
     if (!audioEnabled || !sfx[name] || !sfx[name].buffer) return;
     sfx[name].setVolume(0.5 * vol);
     sfx[name].playbackRate = rate;
     sfx[name].stop(); sfx[name].play();
   }
 
+  // ---------- Assets (placeholders) ----------
+  const texLoader = new THREE.TextureLoader();
+  const bloodDropTex = texLoader.load('assets/images/blood_drop_placeholder.png');
+  const bloodDropModel = 'assets/models/blood_drop_placeholder.glb'; // placeholder model reference
+
   // ---------- Helpers ----------
   const tmpV = new THREE.Vector3();
   function setStatus(text) { statusEl.textContent = text; }
 
   function easeCamTo(pos, look, dur=0.7, ease='power2.out') {
     gsap.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: dur, ease });
     gsap.to(orbit.target, { x: look.x, y: look.y, z: look.z, duration: dur, ease, onUpdate: ()=>orbit.update() });
   }
 
   // ---------- Box & Pedestal ----------
   const root = new THREE.Group(); scene.add(root);
 
   // Pedestal (simple)
   const ped = new THREE.Mesh(
     new THREE.CylinderGeometry(0.35, 0.45, 0.4, 24),
     new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.9, metalness: 0.05 })
   );
   ped.position.y = -0.55; root.add(ped);
 
   // Box base (obsidian slab)
   const box = new THREE.Group(); root.add(box);
   const matObsidian = new THREE.MeshStandardMaterial({
     color: 0x0b0b0b, metalness: 0.4, roughness: 0.25,
     envMapIntensity: 0.8
   });
diff --git a/script.js b/script.js
index 9ea73c30d6a23cc990024aa3381305c3a35da2f1..bfc76ac3fbd36268cbfae9c844edff864ea7bdde 100644
--- a/script.js
+++ b/script.js
@@ -247,117 +252,150 @@
             break;
           }
         }
         if (!snapped) gsap.to(mesh.position, { x: start.x, y: start.y, z: start.z, duration: .25, ease: 'power2.out' });
       }
     };
     interactives.push(mesh);
     return mesh.userData.handle;
   }
 
   // ---------- Mechanisms ----------
   // Step 1: Prick your finger (simple pin you tap to “arm” the box)
   const prickPad = new THREE.Group();
   prickPad.position.set(0.0, 0.12, 0.22);
   box.add(prickPad);
   const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 32), matBrass);
   pad.rotation.x = Math.PI/2;
   prickPad.add(pad);
   const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x992222, metalness: .8, roughness: .4 }));
   needle.position.set(0, 0.04, 0); prickPad.add(needle);
   needle.userData.handle = {
     onDown() {
       if (state.step !== 0) return;
       play('latch', .6);
       gsap.to(needle.scale, { y: 0.5, duration: 0.2, yoyo: true, repeat: 1 });
+      spawnBloodTrail();
       state.bloodStarted = true;
       nextStep();              // step -> 1
       go('pressure');          // guide to next station
       stanzaStrip.style.display = 'block';
-      stanzaStrip.textContent = 'Stanza I glows faintly…';
+      stanzaStrip.textContent = 'Whispered puzzle, dark and deep, blood will rouse it from its sleep.';
     }
   };
   interactives.push(needle);
 
+  function spawnBloodTrail() {
+    const start = new THREE.Vector3();
+    const end = new THREE.Vector3();
+    needle.getWorldPosition(start);
+    pressureDeck.getWorldPosition(end);
+    for (let i = 0; i < 6; i++) {
+      const drop = new THREE.Sprite(new THREE.SpriteMaterial({
+        map: bloodDropTex,
+        color: 0xff0000,
+        transparent: true,
+        opacity: 0.8
+      }));
+      drop.scale.setScalar(0.01);
+      drop.position.copy(start);
+      scene.add(drop);
+      const dur = 0.6 + Math.random() * 0.2;
+      gsap.to(drop.position, { x: end.x, y: end.y, z: end.z, duration: dur, ease: 'power1.out' });
+      gsap.to(drop.material, {
+        opacity: 0,
+        duration: dur,
+        ease: 'power1.out',
+        onComplete: () => {
+          scene.remove(drop);
+          drop.material.dispose();
+          drop.geometry && drop.geometry.dispose();
+        }
+      });
+    }
+  }
+
   // Step 2: Pressure deck — two valves + a gauge
   const pressureDeck = new THREE.Group();
   pressureDeck.position.set(-0.28, 0.1, 0.18);
   box.add(pressureDeck);
 
   const gauge = new THREE.Group(); pressureDeck.add(gauge);
   const dial = new THREE.Mesh(new THREE.CircleGeometry(0.07, 32), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: .4, roughness: .6 }));
   dial.position.set(0, 0.11, 0); gauge.add(dial);
   const needleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.004, 0.004), new THREE.MeshStandardMaterial({ color: 0xdd4444, metalness: .2, roughness: .4 }));
   needleMesh.position.set(0, 0.11, 0.002); gauge.add(needleMesh);
 
   const valveLeft = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 12, 32), matBrass);
   valveLeft.position.set(-0.08, 0.02, 0); pressureDeck.add(valveLeft);
 
   const valveRight = valveLeft.clone(); valveRight.position.x = 0.08; pressureDeck.add(valveRight);
 
   let psi = 0;
   const leftH = makeHinge(valveLeft, 'z', -Math.PI/2, Math.PI/2, 10, onValve);
   const rightH = makeHinge(valveRight, 'z', -Math.PI/2, Math.PI/2, 10, onValve);
 
   function onValve() {
     // simple function: angle sum centered sets "pressure"
     const t = (valveLeft.rotation.z + valveRight.rotation.z + Math.PI) / (2*Math.PI);
     psi = THREE.MathUtils.clamp(t, 0, 1);
     const angle = THREE.MathUtils.lerp(-Math.PI*0.6, Math.PI*0.6, psi);
     needleMesh.rotation.z = angle;
     if (Math.abs(psi - 0.62) < 0.05 && state.step === 1) {
       state.pressureOK = true;
       play('hiss', 0.7);
       nextStep();           // step -> 2
       go('plugboard');
+      stanzaStrip.style.display = 'block';
       stanzaStrip.textContent = 'Stanza II flickers to life…';
     }
   }
 
   // Step 3: Plugboard — one cable to correct port (expand to 5 later)
   const plugboard = new THREE.Group();
   plugboard.position.set(0.32, -0.02, 0.1);
   box.add(plugboard);
 
   // Ports
   const ports = [];
   for (let i=0;i<3;i++){
     const p = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.02, 24), new THREE.MeshStandardMaterial({ color: 0x222222, metalness: .7, roughness: .4 }));
     p.rotation.x = Math.PI/2;
     p.position.set(-0.06 + i*0.06, 0.08, 0.0);
     plugboard.add(p);
     p.userData = { id: i, occupied: false }; ports.push({ id: i, mesh: p, occupied: false });
   }
   // Correct port is id=2 (rightmost) for demo
   const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.05, 24), new THREE.MeshStandardMaterial({ color: 0x343434, metalness: .8, roughness: .35 }));
   plug.position.set(-0.06, -0.02, 0.0);
   plugboard.add(plug);
 
   makePlug(plug, ports, 2, () => {
     if (state.step === 2) {
       state.plugsCorrect = 1;
       nextStep(); // step -> 3
+      stanzaStrip.style.display = 'block';
       stanzaStrip.textContent = 'Stanza III kindles across the bezel…';
       go('glyphs');
       // TODO: reveal a stanza + glyph grid overlay here (Step 4)
     }
   });
 
   // ---------- Step 4–7: scaffolds (we’ll fill these next) ----------
   // Step 4: Glyph entry (show a translucent grid over a face; accept taps in order)
   // TODO: build glyph plane + click order; when correct -> state.glyphSolved = true; nextStep(); go('vampire');
 
   // Step 5: Vampire panel (day/night + upside-down => reveal key)
   // TODO: front face sub-panel with rotate handle; if cube rotated (or handle sim) + "day" state -> show key; nextStep(); go('rings');
 
   // Step 6: Multi-tier ring maze (linked rings)
   // TODO: three concentric rings with coupling ratios; align engraved channels to carry “blood”; when aligned -> nextStep();
 
   // Step 7: Obsidian key forge + final keyhole with bat pivot
   // TODO: animate “hardening” (shader/emissive), show bat cover hinge; insert key (play('key')); open lid -> artefact
 
   // ---------- UI ----------
   resetBtn.addEventListener('click', () => {
     orbit.reset(); orbit.update();
     camera.position.copy(shots.overview.pos);
     orbit.target.copy(shots.overview.look);
     state.step = 0; setStatus('Step: 0 — “Prick to begin”');
