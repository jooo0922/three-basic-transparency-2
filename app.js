'use strict';

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

import {
  OrbitControls
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';

function main() {
  // create WebGLRenderer
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas
  });

  // create camera
  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 25;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0.5, 1, 0.5);

  // create OrbitControls
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0); // OrbitControls에 의해 카메라를 움직일 때 카메라의 시선을 원점으로 고정
  controls.update(); // OrbitControls의 속성값을 바꿔줬으면 업데이트 메서드를 호출해줘야 함.

  // create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('white'); // Color 객체를 만들어서 background에 할당함.

  // 위치값을 받아 DirectionalLight(직사광)을 생성하는 함수
  function addLight(x, y, z) {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(x, y, z);
    scene.add(light);
  }
  addLight(-1, 2, 4);
  addLight(1, -1, -2); // 옆면에서도 빛을 쏴줘서 잘 보일 수 있게 조명을 하나 더 생성함.

  // create planeGeometry
  const planeWidth = 0.5; // 평면 하나를 반으로 쪼개서 생성할거기 때문에 geometry의 width를 절반으로 지정해 줌.
  const planeHeight = 1;
  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

  // create TextureLoader
  const loader = new THREE.TextureLoader();

  // 이미지 텍스처의 url을 입력받아 평면 메쉬를 생성하는 함수
  function makeInstance(geometry, color, rotY, url) {
    // 반으로 쪼갠 두 개의 평면 메쉬를 담아놓을 부모노드
    const base = new THREE.Object3D();
    scene.add(base);
    base.rotation.y = rotY; // 부모노드의 y축 rotation값을 미리 지정해놓음.

    [-1, 1].forEach((x) => {
      /**
       * 전달받은 url로 텍스처를 성공적으로 로드한 뒤 animate 함수를 호출해 줌.
       * 
       * 왜냐? 이 예제에서는 불필요한 렌더링을 제거하는 구조로 코드를 작성했기 때문에, 
       * 텍스처 로드가 완성되기 전에 animate를 최초로 호출하면, 그외에 별도의 이벤트를 받지 않으면 animate 함수가 호출되지 않음.
       * 
       * 그런데 만약 첫 번째 animate가 호출 및 실행될 때까지 텍스처가 로드되지 않는다면?
       * 페이지 로드 시 화면에 아무것도 안나타날거임.
       * 
       * 그래서 텍스처 로드가 성공적으로 완료되면 animate를 한번 더 호출해서 
       * 텍스처가 입혀진 평면 메쉬가 화면에 렌더될 수 있도록 하는거임.
       */
      const texture = loader.load(url, animate);
      texture.offset.x = x < 0 ? 0 : 0.5; // texture.offset.x = 0.5로 할당하면, 텍스처의 절반 지점으로 옮겨서 거기서부터 평면 메쉬에 렌더해 줌. 그니까 하나는 0 지점, 다른 하나는 0.5 지점부터 텍스처를 렌더해주는거지.
      texture.repeat.x = 0.5; // 텍스처의 반복횟수를 0.5로 해주면, 평면메쉬에 그려지는 텍스처는 절반 너비만큼만 그려짐.
      const material = new THREE.MeshPhongMaterial({
        color,
        map: texture,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide, // 평면을 둘러보려면 양면을 모두 렌더해줘야 하니 DoubleSide로 지정함.
      });

      const mesh = new THREE.Mesh(geometry, material);
      // scene.add(mesh);
      base.add(mesh);

      // mesh.rotation.y = rotY; // 하나는 0도, 하나는 90도로 할당해줘야 서로 직교하는 두 개의 평면 메쉬가 생성되겠지
      // 원래 각 평면메쉬를 x축으로 움직이지 않는다면 같은 자리에 포개어지는데,
      // 평면 메쉬 하나는 x축으로 -0.25만큼 이동, 다른 하나는 x축으로 0.25만큼 이동하면, 각 평면 메쉬의 기준점을 기준으로 0.5만큼 거리차가 나고,
      // 평면 메쉬는 각각 너비가 0.5니까 둘을 총합해서 너비가 1이 되는 평면 메쉬로 보이겠지
      mesh.position.x = x * 0.25;
    });
  }

  // 하나는 0도, 하나는 90도로 y축을 회전시키는 평면 메쉬 두 개를 생성함.
  // 근데 얘도 예제 1번과 마찬가지로 먼저 생성된 pink 메쉬는 뒤에 있어도 비치지만, lightblue는 뒤에 있으면 안 보임. 왜? pixel의 depth값이 깊으니까 WebGL이 렌더해주지 않으니까.
  // 이걸 해결하려면 makeInstance에서 각 평면 메쉬를 둘로 쪼개서 생성함으로써, 두 평면이 실제로는 서로 교차하지 않게끔 만들면 됨.
  // 왜냐면, 서로 교차하는 두 개의 메쉬에서는 Three.js가 위의 문제들을 자동으로 처리해주지 않지만, 얘내들을 서로 교차하지 않는 4개의 메쉬들로 만들어준다면? 8개의 큐브 예제처럼 mesh가 알아서 처리해주는거임.
  // 이처럼 위의 문제는 두 메쉬가 교차하는 경우이거나, 하나의 메쉬 안에서 뒷면이 보이지 않는 경우는 Three.js가 알아서 처리해주지 못하는 것 같음.
  makeInstance(geometry, 'pink', 0, 'https://threejsfundamentals.org/threejs/resources/images/happyface.png');
  makeInstance(geometry, 'lightblue', Math.PI * 0.5, 'https://threejsfundamentals.org/threejs/resources/images/hmmmface.png');

  // resize renderer
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  // animate 메서드 실행 중 다음 animate 함수가 이미 request 되었을 때, OrbitControls.update()에 의해 중복호출되는 것을 방지하기 위한 변수값. 
  let animateRequested = false;

  function animate() {
    animateRequested = undefined;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
  }

  animate(); // 일단 최초로 한 번 호출해줘서 화면에 첫 프레임을 렌더해주도록 함.

  // animate 함수 내부에서 OrbitControls.update() 메서드에 의해 animate가 중복호출되는지 아닌지 체크해주는 함수
  function requestAnimateIfNotRequested() {
    if (!animateRequested) {
      animateRequested = true;
      requestAnimationFrame(animate);
    }
  }

  // OrbitControls에 change 이벤트가 발생하거나, 브라우저에 resize 이벤트가 발생할 시 animate를 호출함.
  controls.addEventListener('change', requestAnimateIfNotRequested);
  window.addEventListener('resize', requestAnimateIfNotRequested);
}

main();