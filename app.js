const $ = s => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches,
    quantity = 1,
    bagCount = 0,
    toastTimer;
const bag = $('#bag'),
    money = n => '£' + (n * 8.99).toFixed(2);
function renderBag() {
    $('#cart-count').textContent = bagCount;
    $('#bag-content').innerHTML = bagCount ? `<div class="bag-item"><h3>The Original Chaos Can</h3><p>20 flavour pouches · ${money(1)} each</p><div class="bag-item-controls"><button data-bag="less" aria-label="Remove one can">−</button><output aria-label="Cans in bag">${bagCount}</output><button data-bag="more" aria-label="Add one can">+</button><button data-bag="remove" class="remove">Remove</button></div><div class="subtotal"><span>Subtotal</span><span>${money(bagCount)}</span></div></div>` : '<p class="bag-empty">No chaos in here. Yet.</p>';
}
function addToBag(count) {
    if (!Number.isInteger(count) || count < 1 || count > 20)
        throw Error('Choose between 1 and 20 cans.');
    const added = Math.min(count, 99 - bagCount);
    bagCount += added;
    renderBag();
    $('#toast').textContent = added ? `${added} ${added === 1 ? 'can' : 'cans'} added. Chaos contained.` : 'Your bag has reached the 99-can limit.';
    $('#toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3000);
    return {
        cansInBag: bagCount,
        subtotal: money(bagCount),
        demo: true
    };
}
$('#less').onclick = () => {
    $('#quantity').textContent = quantity = Math.max(1, quantity - 1);
};
$('#more').onclick = () => {
    $('#quantity').textContent = quantity = Math.min(20, quantity + 1);
};
$('#add-bag').onclick = () => addToBag(quantity);
$('#open-bag').onclick = () => {
    renderBag();
    bag.showModal();
};
$('#close-bag').onclick = $('#continue-browsing').onclick = () => bag.close();
$('#bag-content').onclick = e => {
    const a=e.target.closest('[data-bag]')?.dataset.bag;
    if (a) {
        bagCount = a === 'remove' ? 0 : Math.max(0, Math.min(99, bagCount + (a === 'more' ? 1 : -1)));
        renderBag();
    }
};
function syncMotion() {
    document.body.classList.toggle('motion-paused', paused);
    $('#motion-toggle').textContent = paused ? '▶' : 'Ⅱ';
    $('#motion-toggle').setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
    $('#motion-toggle').setAttribute('aria-pressed', String(paused));
}
$('#motion-toggle').onclick = () => {
    paused = !paused;
    syncMotion();
};
reduced.addEventListener('change', () => {
    paused = reduced.matches;
    syncMotion();
});
syncMotion();
renderBag();
try {
    await initPouch();
} catch (e) {
    console.warn('3D preview unavailable', e);
    $('.spin-controls').hidden = true;
    $('#pouch-fallback').hidden = false;
}
async function initPouch() {
    const THREE = await import('./vendor/three.module.js');
    const host = $('#pouch-view'),
        scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.append(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
    camera.position.set(0, 0, 8.4);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x735280, 2.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffbcf1, 3);
    rim.position.set(4, 2, -3);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 1);
    fill.position.set(0, -2, 4);
    scene.add(fill);
    const pack = new THREE.Group();
    scene.add(pack);
    const can = new THREE.Group();
    can.rotation.x = Math.PI / 2;
    pack.add(can);
    const texture = await new THREE.TextureLoader().loadAsync('assets/can-lid.png');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const plastic = new THREE.MeshPhysicalMaterial({
        color: 0xfff9ef,
        roughness: .28,
        metalness: .03,
        clearcoat: .45
    });
    const rimMaterial = new THREE.MeshStandardMaterial({
        color: 0xf0e5f5,
        roughness: .3,
        metalness: .1
    });
    const labelMaterial = new THREE.MeshPhysicalMaterial({
        map: texture,
        roughness: .48,
        metalness: .02,
        clearcoat: .3,
        clearcoatRoughness: .4
    });
    const sideCanvas = document.createElement('canvas');
    sideCanvas.width = 2048;
    sideCanvas.height = 320;
    const sideContext = sideCanvas.getContext('2d');
    sideContext.fillStyle = '#6419dc';
    sideContext.fillRect(0, 0, 2048, 320);
    sideContext.fillStyle = '#d3ff40';
    sideContext.fillRect(0, 0, 2048, 18);
    sideContext.fillStyle = '#ff8bdd';
    sideContext.fillRect(0, 302, 2048, 18);
    sideContext.textAlign = 'center';
    sideContext.fillStyle = '#fff9ef';
    sideContext.font = '900 110px Impact, Arial';
    sideContext.fillText('CHAOS POUCH', 510, 155);
    sideContext.fillText('NICE OR NASTY?', 1540, 155);
    sideContext.font = '700 36px Arial';
    sideContext.fillText('20 POUCHES • NICOTINE FREE', 510, 245);
    sideContext.fillText('MYSTERY FLAVOUR POUCHES', 1540, 245);
    const sideTexture = new THREE.CanvasTexture(sideCanvas);
    sideTexture.colorSpace = THREE.SRGBColorSpace;
    sideTexture.anisotropy = 4;
    const sideMaterial = new THREE.MeshPhysicalMaterial({
        map: sideTexture,
        roughness: .43,
        metalness: .02,
        clearcoat: .3
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.39, 1.36, .48, 128), [sideMaterial, plastic, plastic]);
    can.add(body);
    const baseRim = new THREE.Mesh(new THREE.CylinderGeometry(1.365, 1.34, .055, 128), plastic);
    baseRim.position.y = -.262;
    can.add(baseRim);
    const seam = new THREE.Mesh(new THREE.CylinderGeometry(1.398, 1.398, .023, 128), new THREE.MeshStandardMaterial({
        color: 0x542279,
        roughness: .6
    }));
    seam.position.y = .244;
    can.add(seam);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.43, 1.41, .095, 128), plastic);
    lid.position.y = .304;
    can.add(lid);
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.345, 128), labelMaterial);
    face.rotation.x = -Math.PI / 2;
    face.position.y = .353;
    can.add(face);
    const lidRim = new THREE.Mesh(new THREE.TorusGeometry(1.393, .026, 12, 128), rimMaterial);
    lidRim.rotation.x = Math.PI / 2;
    lidRim.position.y = .342;
    can.add(lidRim);
    const bottomCanvas = document.createElement('canvas');
    bottomCanvas.width = 1024;
    bottomCanvas.height = 1024;
    const bc = bottomCanvas.getContext('2d');
    bc.fillStyle = '#6419dc';
    bc.fillRect(0, 0, 1024, 1024);
    bc.textAlign = 'center';
    bc.fillStyle = '#fff9ef';
    bc.font = '900 120px Impact, Arial';
    bc.fillText('CHAOS POUCH', 512, 365);
    bc.fillStyle = '#d3ff40';
    bc.font = '900 78px Arial';
    bc.fillText('NICE OR NASTY?', 512, 510);
    bc.fillStyle = '#fff9ef';
    bc.font = '32px Arial';
    bc.fillText('20 POUCHES • NICOTINE FREE', 512, 665);
    bc.font = '25px Arial';
    bc.fillText('CONCEPT PACKAGING', 512, 745);
    const bottomTexture = new THREE.CanvasTexture(bottomCanvas);
    bottomTexture.colorSpace = THREE.SRGBColorSpace;
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(1.27, 96), new THREE.MeshStandardMaterial({
        map: bottomTexture,
        roughness: .6
    }));
    bottom.rotation.x = Math.PI / 2;
    bottom.rotation.z = Math.PI;
    bottom.position.y = -.292;
    can.add(bottom);
    let targetSpin = 0,
        currentSpin = 0,
        drag = false,
        lastX = 0,
        pointerTilt = 0,
        progress = 0,
        lastTime = 0,
        floatTime = 0;
    const stage = $('#stage'),
        journey = $('#journey');
    function resize() {
        const r = host.getBoundingClientRect();
        renderer.setSize(r.width, r.height, false);
        camera.aspect = r.width / r.height;
        camera.updateProjectionMatrix();
        camera.position.z = innerWidth < 681 ? 8.6 : 8.1;
    }
    new ResizeObserver(resize).observe(host);
    resize();
    host.addEventListener('pointerdown', e => {
        drag = true;
        lastX = e.clientX;
        host.setPointerCapture(e.pointerId);
    });
    host.addEventListener('pointermove', e => {
        if (drag) {
            targetSpin += (e.clientX - lastX) * .012;
            lastX = e.clientX;
        } else if (!paused) {
            const r = host.getBoundingClientRect();
            pointerTilt = ((e.clientY - r.top) / r.height - .5) * .15;
        }
    });
    const stop = () => {
        drag = false;
    };
    host.addEventListener('pointerup', stop);
    host.addEventListener('pointercancel', stop);
    host.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            targetSpin += e.key === 'ArrowRight' ? .4 : -.4;
        }
    });
    $('#spin-pouch').onclick = () => {
        targetSpin += Math.PI * 2;
    };
    const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
    $('#pouch-fallback').hidden = true;
    function frame(time) {
        const dt = Math.min((time - lastTime) / 1000, .05);
        lastTime = time;
        const offset = Math.max(0, -journey.getBoundingClientRect().top),
            heroHeight = $('.hero').offsetHeight;
        const travel = clamp(offset / (heroHeight * .7), 0, 1);
        progress = paused ? travel : progress + (travel - progress) * .16;
        if (!paused)
            floatTime += dt;
        const smooth = progress * progress * (3 - 2 * progress),
            mobile = innerWidth < 681;
        const travelY = clamp(offset, 0, journey.offsetHeight - stage.offsetHeight);
        stage.style.transform = mobile ? 'translateY(560px)' : `translate(${-smooth * 92}%,${travelY}px)`;
        currentSpin += (targetSpin - currentSpin) * .07;
        pack.rotation.set(.40 + pointerTilt + Math.sin(floatTime * .7) * .035, .28 + currentSpin + (paused ? 0 : smooth * Math.PI * 2), -.18 + Math.sin(floatTime * .9) * .035 + smooth * .12);
        pack.position.y = .15 + Math.sin(floatTime * 1.1) * .055;
        if (!document.hidden)
            renderer.render(scene, camera);
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}
