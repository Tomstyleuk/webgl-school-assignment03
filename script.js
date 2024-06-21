import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';


/*
* Cities
*/
const cities = [];
const citiesPoints = [
  [31.6286, -7.9920],       // Morocco
  [50.0755, 14.4378],       // Prague
  [44.8378, -0.5792],       // Bordeaux
  [50.9351, 6.9531],        // koln
  [41.1579, -8.6291],       // Porto
  [51.5074, -0.1278],       // London
  [75.7069, -30.6043],      // Greenland
  [60.5888, -160.4931],     // Alaska
  [29.67770, -192.85574],   // Whale
  [11.8419, -175.7864],     // Dragon
  [-21.0926, -185.1834],    // Shark
  [-43.5590, -175.8294],    // Fish
  [7.6991, 4.2390],         // Nigeria
];

const countriesName = [
  'Morocco',
  'Czech',
  'France',
  'Germany',
  'Portugal',
  'England',
  'Greenland',
  'Alaska',
  '',
  '',
  '',
  '',
  'Nigeria',
]


/*
 * City images
 */
const cityImages = [
  'morocco.jpg',
  'prague.jpg',
  'bordeaux.jpg',
  'koln.jpg',
  'porto.jpg',
  'london.jpg',
  'greenland.jpg',
  'alaska.jpg',
  'whale.jpg',
  'shark.jpg',
  'dragon.jpg',
  'fish.jpg',
  'nigeria.jpg',
]


window.addEventListener('DOMContentLoaded', async () => {
  const wrapper = document.querySelector('#webgl');
  const app = new ThreeApp(wrapper);

  await app.earthLoad();
  await app.airplainLoad();
  await app.fontLoad();

  app.init();
  app.resize()
  app.render();
}, false);


class ThreeApp {
  static PI = 3.141592653589793;

  /**
   * Size scale - airplain
   */
  static AIRPLANE_SCALE = 0.001;


  /**
   * Space between earth & airplain
   */
  static AIRPLANE_DISTANCE = 110;


  /**
   * Turn scale
   */
  static PLANE_TURN_SCALE = 0.1;

  static AIRPLANE_CAMERA_DISTANCE = 20;


  /**
   * Initial start position at Istanbul
   */
  static Istanbul_LAT = 41.0082;
  static Istanbul_LON = 28.9784;


  /**
   * カメラ定義のための定数
   */
  static CAMERA_PARAM = {
    fovy: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.01,
    far: 2000,
    position: new THREE.Vector3(0.0, 2.0, 200.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0)
  };


  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    // clearColor: 0xffffff,
    clearColor: 0xededed,
    width: window.innerWidth,
    height: window.innerHeight
  };


  /**
   * 平行光源定義のための定数
   */
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 1.5,
    position: new THREE.Vector3(1.0, 1.0, 1.0)
  };


  /**
   * アンビエントライト定義のための定数
   */
  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 0.5,
  };


  /**
   * マテリアル定義のための定数
   */
  static MATERIAL_PARAM = {
    color: 0xffffff,
  };


  wrapper;
  renderer;
  scene;
  camera;
  directionalLight;
  ambientLight;
  controls;
  axesHelper;
  clock;
  sphereGeometry;

  earthGroup;

  earth;
  earthMaterial;
  earthTexture;

  planeDirection;
  airplaneObj;


  /**
   * コンストラクタ
   * @constructor
   * @param {HTMLElement} wrapper - canvas 要素を append する親要素
   */
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.render = this.render.bind(this);
  }


  /**
   * Resize
   */
  resize() {
    window.addEventListener('resize', () => {
      this.camera.updateProjectionMatrix();
      this.camera.aspect = window.innerWidth / window.innerHeight;

      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }, false);
  }


  /**
   * Loading assets
   */
  earthLoad() {
    return new Promise((resolve) => {
      const earthPath = 'images/earth-2k.jpg';
      const loader = new THREE.TextureLoader();
      loader.load(earthPath, (earthTexture) => {
        this.earthTexture = earthTexture;
        resolve();
      });
    });
  }

  loadCityImage(imageUrl) {
    return new Promise((resolve, reject) => {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(imageUrl, (texture) => {
        resolve(texture);
      }, undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  airplainLoad() {
    return new Promise((resolve) => {
      const ObjLoader = new OBJLoader();
      const objPath = '/model/airplane.obj';

      ObjLoader.load(objPath, (object) => {
        this.airplaneObj = object
        this.airplaneObj.position.set(0.0, 1.0, 0.0);

        this.airplaneObj.scale.setScalar(ThreeApp.AIRPLANE_SCALE);
        resolve()
      },
        function (progress) {
          // console.log((progress.loaded / progress.total * 100) + '% loaded');
        },
        function (error) {
          console.log('An error happened');
          console.log(error);
        }
      );
    });
  };


  init() {
    /**
     * Renderer
     */
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.renderer.setClearAlpha(0.0); // Debug
    // this.renderer.setClearColor(color);
    this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
    this.wrapper.appendChild(this.renderer.domElement);


    /**
     * Scene
     */
    this.scene = new THREE.Scene();


    /**
     * Camera
     */
    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far,
    );
    const radius = 130;
    const istanbulPos = this.translateGeoCoords(ThreeApp.Istanbul_LAT, ThreeApp.Istanbul_LON, radius);
    this.camera.position.set(istanbulPos.x - 10, istanbulPos.y - 3, istanbulPos.z - 10);
    this.camera.lookAt(istanbulPos);


    /**
     * Directional Light
     */
    this.directionalLight = new THREE.DirectionalLight(
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.color,
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.copy(ThreeApp.DIRECTIONAL_LIGHT_PARAM.position);
    this.scene.add(this.directionalLight);


    /**
     * Ambient Light
     */
    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);


    /**
     * Earth
     */
    this.sphereGeometry = new THREE.SphereGeometry(105, 32, 32);
    this.earthMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);
    this.earthMaterial.map = this.earthTexture;
    this.earth = new THREE.Mesh(this.sphereGeometry, this.earthMaterial);
    this.scene.add(this.earth);


    /**
     * Airplane
     */
    this.planeDirection = new THREE.Vector3(0.0, 1.0, 0.0).normalize();
    this.airplaneObj.position.x += 2;

    // Set initial rotation
    this.airplaneObj.rotation.z += ThreeApp.PI / 2;
    this.airplaneObj.scale.set(
      ThreeApp.AIRPLANE_SCALE,
      ThreeApp.AIRPLANE_SCALE,
      ThreeApp.AIRPLANE_SCALE
    );

    if (this.airplaneObj) {
      this.scene.add(this.airplaneObj);
    }


    /**
     * OrbitControls
     */
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true


    /**
     * Helper
     */
    const axesBarLength = 150;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    // this.scene.add(this.axesHelper);


    /**
     * Create Cities'point and font
     */
    this.fontLoad().then((font) => {
      this.displayItems(font);
    }).catch((error) => {
      console.error('Font loading failed:', error);
    });


    /**
     * Group
     */
    this.earthGroup = new THREE.Group()
    this.earthGroup.add(this.earth)
    this.scene.add(this.earthGroup)
    this.earthGroup.rotation.y -= ThreeApp.PI / 2;

    this.clock = new THREE.Clock();
  }


  /**
   * Font Load
  */
  fontLoad() {
    return new Promise((resolve, reject) => {
      const fontLoader = new FontLoader();
      fontLoader.load('/font/helvetiker_regular.typeface.json', function (font) {
        resolve(font);
      }, undefined, (error) => {
        reject(error);
      });
    });
  }


  /**
   * items based on the cities, names & images
   * @param {THREE.Font} font - Loaded font for text rendering
   */
  displayItems(font) {
    const imagePromises = citiesPoints.map((coords, i) => {
      const latitude = coords[0];
      const longitude = coords[1];

      // Display city name
      const country = countriesName[i];
      if (country) {
        const textGeometry = new TextGeometry(country, {
          font: font,
          size: 0.6,
          height: 0.1,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        const position = this.translateGeoCoords(latitude, longitude, 105);
        textMesh.position.copy(position);
        textMesh.rotation.set(0.2, ThreeApp.PI / 2, 0);

        this.scene.add(textMesh);
        this.earthGroup.add(textMesh);
      }

      // Display city image
      const imageUrl = `/images/${cityImages[i]}`;
      if (imageUrl) {
        return this.loadCityImage(imageUrl).then((texture) => {
          const geometry = new THREE.PlaneGeometry(3, 3, 20, 20);
          const imageMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
          });
          const mesh = new THREE.Mesh(geometry, imageMaterial);

          const position = this.translateGeoCoords(latitude, longitude + 1, 108);
          mesh.position.copy(position);

          // Calculate rotation to face camera or other specific direction, e.g., make it face outward from the globe
          const direction = position.clone().normalize();
          const axis = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
          const angle = Math.acos(new THREE.Vector3(0, 1, 0).dot(direction));

          mesh.quaternion.setFromAxisAngle(axis, angle);
          mesh.rotateY(latitude < 0 ? ThreeApp.PI : 1.6); // Rotate if the latitude is in the southern hemisphere

          this.scene.add(mesh);
          this.earthGroup.add(mesh);
        });
      }
    });
  }


  /**
  * 緯度経度から位置を算出
  * @param {number} latitude 緯度です(単位は度数法)
  * @param {number} longitude 経度です(単位は度数法)
  * @param {number} radius 半径
  * @returns {THREE.Vector3} 3Dの座標
  * @see https://ics.media/entry/10657
  */
  translateGeoCoords = (latitude, longitude, radius = 105) => {
    // 仰角
    const phi = latitude * ThreeApp.PI / 180;

    // 方位角
    const theta = (longitude + 180) * ThreeApp.PI / 180;

    const x = -1 * radius * Math.cos(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi);
    const z = radius * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  };


  render() {
    requestAnimationFrame(this.render);
    this.controls.update();

    const time = this.clock.getElapsedTime();
    const speed = time * 0.1;

    // 前フレームの飛行機の位置
    const prevPosition = this.airplaneObj.position.clone();

    // 現在の角度を三角関数で表現
    const sin = Math.sin(speed);
    const cos = Math.cos(speed);

    // 次のフレームの飛行機の位置を計算
    const nextX = 0.0;
    const nextY = sin * ThreeApp.AIRPLANE_DISTANCE;
    const nextZ = cos * ThreeApp.AIRPLANE_DISTANCE;

    // 次の飛行機の位置ベクトル
    const nextPosition = new THREE.Vector3(nextX, nextY, nextZ);
    this.airplaneObj.position.copy(nextPosition);


    // (A) 現在（前のフレームまで）の進行方向を変数に保持しておく
    const previousDirection = this.planeDirection.clone();
    // (終点 - 始点) という計算を行い、２点間を結ぶベクトルを定義
    const subVector = nextPosition.clone().sub(prevPosition);

    // ベクトルを単位化して、長さは無視して向きだけに注視する
    subVector.normalize();
    // 飛行機の進行方向ベクトルに、向きベクトルを小さくスケールして加算する
    this.planeDirection.add(
      subVector.multiplyScalar(ThreeApp.PLANE_TURN_SCALE)
    );

    // (B) 加算したことでベクトルの長さが変化するので、単位化してカメラの座標に加算する
    this.planeDirection.normalize();
    const direction = this.planeDirection.clone();
    this.airplaneObj.position.add(direction.multiplyScalar(ThreeApp.PLANE_TURN_SCALE));

    // (C) 変換前と変換後の２つのベクトルから外積で法線ベクトルを求めて、回転軸を定義する
    const normalAxis = new THREE.Vector3().crossVectors(
      previousDirection,
      this.planeDirection
    );

    // 正規化して回転軸として使う
    normalAxis.normalize();

    // (D) 変換前と変換後のふたつのベクトルから内積でコサインを取り出す
    const cosin = previousDirection.dot(this.planeDirection);

    // (D) コサインをラジアンに戻す(回転量)
    const radians = Math.acos(cosin);

    // 求めた法線ベクトルとラジアンからクォータニオンを定義し、回転軸と回転量を代入する
    const qtn = new THREE.Quaternion().setFromAxisAngle(normalAxis, radians);

    // 飛行機の現在のクォータニオンに乗算する
    this.airplaneObj.quaternion.premultiply(qtn);


    /**
     * Setup for camera position
     */
    // 飛行機の位置ベクトル
    const airplanePosition = this.airplaneObj.position.clone();

    // カメラの位置を設定
    const backwardVector = this.planeDirection.clone().negate();
    // 逆向きベクトルをAIRPLANE_CAMERA_DISTANCE分引き伸ばす。
    backwardVector.multiplyScalar(ThreeApp.AIRPLANE_CAMERA_DISTANCE);
    this.camera.position.copy(airplanePosition.clone().add(backwardVector));
    this.camera.position.x -= 2

    // airplaneObjの現在の位置に向かって、原点から伸びるベクトルを単位化したもの
    const airplaneUpDirection = airplanePosition.clone().normalize();
    this.camera.up.copy(airplaneUpDirection);

    // カメラの向きを飛行機に向ける
    this.camera.lookAt(this.airplaneObj.position);

    this.renderer.render(this.scene, this.camera);
  }
}