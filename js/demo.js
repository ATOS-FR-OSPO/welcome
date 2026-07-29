// Shader Animation ATOS - Plasma avec couleurs ATOS

const canvas = document.getElementById('demo-canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

if (!gl) {
  console.error("WebGL not supported");
}

// Canvas 2D pour le scroll text
const canvas2D = document.createElement('canvas');
canvas2D.style.position = 'fixed';
canvas2D.style.top = '0';
canvas2D.style.left = '0';
canvas2D.style.pointerEvents = 'none';
document.body.appendChild(canvas2D);
const ctx2D = canvas2D.getContext('2d');

// Canvas 2D pour le logo ondulé
const logoCanvas = document.createElement('canvas');
logoCanvas.style.position = 'fixed';
logoCanvas.style.top = '20px';
logoCanvas.style.left = '50%';
logoCanvas.style.transform = 'translateX(-50%)';
logoCanvas.style.pointerEvents = 'none';
logoCanvas.style.zIndex = '100';
document.body.appendChild(logoCanvas);
const logoCtx = logoCanvas.getContext('2d');

// Image du logo
let logoImage = null;
const logoImg = new Image();
logoImg.src = 'assets/logo-atos.svg';
logoImg.onload = function() {
  logoImage = logoImg;
  logoCanvas.width = logoImg.width;
  logoCanvas.height = logoImg.height;
};

// Redimensionner le canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  
  canvas2D.width = window.innerWidth;
  canvas2D.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Vertex Shader
const vertexShader = `
  attribute vec2 position;
  
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Fragment Shader - Plasma avancé avec couleurs ATOS
const fragmentShader = `
  precision highp float;
  
  uniform float time;
  uniform vec2 resolution;
  
  // Couleurs ATOS
  const vec3 ATOS_BLUE = vec3(0.0, 0.451, 0.902);      // #0073E6
  const vec3 ATOS_ORANGE = vec3(0.0, 0.0, 0.361);    // #00005c
  const vec3 ATOS_WHITE = vec3(1.0, 1.0, 1.0);
  const vec3 ATOS_DARK = vec3(0.05, 0.16, 0.26);   // #0a2a43
  
  // Fonction de bruit hash
  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }
  
  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    
    float n = p.x + p.y * 157.0 + 113.0 * p.z;
    return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                   mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
              mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                   mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
  }
  
  float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    for(int i = 0; i < 4; i++) {
      v += a * noise(x);
      x *= 2.0;
      a *= 0.5;
    }
    return v;
  }
  
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 center = vec2(0.5, 0.5);
    float aspect = resolution.x / resolution.y;
    
    // Coordonnées distordues
    vec2 p = uv - center;
    p.x *= aspect;
    
    // Distance du centre
    float dist = length(p);
    float angle = atan(p.y, p.x);
    
    // Bruit 3D pour l'effet plasma turbulent
    vec3 pos = vec3(p * 3.0, time * 0.5);
    float turbulence = fbm(pos);
    
    // Vagues électriques fluides
    float wave1 = sin(dist * 8.0 - time * 3.0 + turbulence * 2.0) * 0.5 + 0.5;
    float wave2 = cos(angle * 5.0 + time * 2.5 - turbulence) * 0.5 + 0.5;
    float wave3 = sin((dist + time * 0.7) * 6.0 + turbulence * 1.5) * 0.5 + 0.5;
    
    // Combinaison des vagues
    float plasma = (wave1 + wave2 * 0.7 + wave3 * 0.6) / 2.3;
    
    // Ajouter de la turbulence au plasma
    plasma = mix(plasma, turbulence, 0.3);
    
    // Ajouter des éclairs électriques
    float lightning = pow(abs(sin(angle * 8.0 + time * 4.0)), 3.0) * 
                      exp(-dist * 2.0) * 0.5;
    plasma += lightning;
    
    // Créer des filaments dynamiques
    float filament = abs(sin(dist * 12.0 - time * 5.0 + angle * 3.0)) * 
                     exp(-dist * 1.5) * 0.4;
    plasma = mix(plasma, filament, 0.5);
    
    // Normaliser
    plasma = clamp(plasma, 0.0, 1.0);
    
    // Mapper les couleurs avec gradient électrique
    vec3 color = ATOS_DARK;
    
    if (plasma < 0.2) {
      // Très faible : noir profond
      color = ATOS_DARK;
    } else if (plasma < 0.4) {
      // Faible : bleu foncé
      color = mix(ATOS_DARK, ATOS_BLUE, (plasma - 0.2) * 5.0);
    } else if (plasma < 0.6) {
      // Moyen : bleu pur
      color = mix(ATOS_BLUE, ATOS_ORANGE, (plasma - 0.4) * 5.0);
    } else if (plasma < 0.8) {
      // Fort : orange lumineux
      color = mix(ATOS_ORANGE, ATOS_WHITE, (plasma - 0.6) * 5.0);
    } else {
      // Très fort : blanc éclatant
      color = ATOS_WHITE;
    }
    
    // Ajouter de l'émission lumineuse basée sur le plasma
    color += ATOS_BLUE * plasma * plasma * 0.3;
    color += ATOS_ORANGE * (1.0 - dist) * plasma * 0.2;
    
    // Augmenter la saturation et le contraste
    color *= 1.2 + plasma * 0.3;
    
    // Appliquer une vignette pour converger vers le centre
    float vignette = 1.0 - dist * 0.6;
    color *= vignette;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Compiler les shaders
function compileShader(source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

const vShader = compileShader(vertexShader, gl.VERTEX_SHADER);
const fShader = compileShader(fragmentShader, gl.FRAGMENT_SHADER);

// Créer le programme
const program = gl.createProgram();
gl.attachShader(program, vShader);
gl.attachShader(program, fShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error('Program link error:', gl.getProgramInfoLog(program));
}

gl.useProgram(program);

// Créer la géométrie (fullscreen quad)
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const positions = [
  -1, -1,
   1, -1,
  -1,  1,
   1,  1,
];

gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Récupérer les uniforms
const timeLocation = gl.getUniformLocation(program, 'time');
const resolutionLocation = gl.getUniformLocation(program, 'resolution');

// Fonction pour animer le logo avec ondulation horizontale
function drawAnimatedLogo() {
  if (!logoImage) return;
  
  const tSec = performance.now() * 0.001;
  const logoWidth = 600;
  const logoHeight = 240;
  const lineHeight = 2; // hauteur de chaque découpe
  const waveAmp = 8; // amplitude de l'ondulation
  const waveFreq = 0.5; // fréquence de l'ondulation
  
  logoCanvas.width = logoWidth;
  logoCanvas.height = logoHeight;
  
  // Effacer le canvas
  logoCtx.clearRect(0, 0, logoWidth, logoHeight);
  
  // Découper et dessiner ligne par ligne avec ondulation (3 lignes par 3 lignes)
  const numLines = Math.ceil(logoHeight / lineHeight);
  
  for (let i = 0; i < numLines; i++) {
    const y = i * lineHeight;
    
    // Calculer le groupe (grouper par 3 lignes)
    const groupIndex = Math.floor(i / 3);
    
    // Calculer l'ondulation horizontale par groupe
    const waveOffset = Math.sin(tSec * 3.0 + groupIndex * waveFreq) * waveAmp;
    
    // Sauvegarder le contexte
    logoCtx.save();
    
    // Appliquer la translation avec ondulation
    logoCtx.translate(waveOffset, 0);
    
    // Découper une bande horizontale
    logoCtx.beginPath();
    logoCtx.rect(0, y, logoWidth, lineHeight);
    logoCtx.clip();
    
    // Dessiner l'image
    logoCtx.drawImage(logoImage, 0, 0, logoImg.width, logoImg.height, 0, 0, logoWidth, logoHeight);
    
    // Restaurer le contexte
    logoCtx.restore();
  }
}

// Fonction pour dessiner le scroll text
function drawScrollText() {
  const text = "Open source program office";
  const tSec = performance.now() * 0.001;
  const width = canvas2D.width;
  const height = canvas2D.height;
  
  // Utiliser la même formule de fontSize que ospoText
  const fontSize = Math.max(56, Math.min(112, Math.floor(width / 9)));
  const charStep = fontSize * 0.72;
  const textWidth = charStep * text.length;
  const travel = width + textWidth + 200;
  
  // Paramètres d'animation du snake
  const snakeSpacing = 0.34;
  const snakeAmpX = 20;
  const snakeAmpY = 14;
  const bobAmp = 18;
  const scrollSpeed = 140;
  const cyclePadding = 120;
  
  // Calcul de baseX avec la formule ospoText
  const baseX = width + cyclePadding - (tSec * scrollSpeed) % travel +
                Math.sin(tSec * 1.99) * 36 +
                Math.cos(tSec * 0.4) * 22;
  
  // Calcul de baseY avec la formule ospoText
  const baseY = Math.max(
    fontSize,
    height - 100 + Math.sin(tSec * 2.4) * bobAmp
  );
  
  ctx2D.font = "bold " + fontSize + "px monospace";
  ctx2D.textBaseline = "middle";
  ctx2D.textAlign = "left";
  
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    
    // Application de la formule snake d'animation ospoText
    const phase = tSec * 4.4 - i * snakeSpacing;
    const letterX = baseX +
                    i * charStep +
                    Math.sin(phase) * snakeAmpX +
                    Math.cos(phase * 0.85) * 8;
    const letterY = baseY +
                    Math.cos(phase * 1.15) * snakeAmpY +
                    Math.sin(phase * 0.65) * 6;
    
    // Ombre
    ctx2D.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx2D.fillText(ch, letterX + 2, letterY + 2);
    
    // Gradient de couleur ATOS
    const grad = ctx2D.createLinearGradient(letterX, letterY - fontSize * 0.5, letterX, letterY + fontSize * 0.5);
    grad.addColorStop(0, "#2b2b2b");
    grad.addColorStop(0.5, "#f2f2f2");
    grad.addColorStop(1, "#cecece");
    
    ctx2D.fillStyle = grad;
    ctx2D.fillText(ch, letterX, letterY);
  }
}

// Boucle d'animation
let startTime = Date.now();

function render() {
  const elapsed = (Date.now() - startTime) / 1000;
  
  gl.uniform1f(timeLocation, elapsed);
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  
  // Effacer et dessiner le logo ondulé
  drawAnimatedLogo();
  
  // Effacer et dessiner le texte
  ctx2D.clearRect(0, 0, canvas2D.width, canvas2D.height);
  drawScrollText();
  
  requestAnimationFrame(render);
}

render();