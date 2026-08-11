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
logoCanvas.style.top = '50px';
logoCanvas.style.left = '50%';
logoCanvas.style.transform = 'translateX(-50%)';
logoCanvas.style.pointerEvents = 'none';
logoCanvas.style.zIndex = '100';
document.body.appendChild(logoCanvas);
const logoCtx = logoCanvas.getContext('2d');

// Image du logo
let logoImage = null;
let logoSourceWidth = 0;
let logoSourceHeight = 0;
const logoImg = new Image();
logoImg.src = 'assets/logo-atos.png';
logoImg.onload = function() {
  logoImage = logoImg;
  // Utiliser les dimensions natives de l'image pour conserver le bon ratio.
  logoSourceWidth = logoImg.naturalWidth || logoImg.width;
  logoSourceHeight = logoImg.naturalHeight || logoImg.height;
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
  const vec3 ATOS_ORANGE = vec3(0.808, 0.808, 0.808);    // #cecece
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
    vec2 center = vec2(0.55, 0.5);
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

// Variable pour stocker le texte chargé depuis le fichier
let freeTextContent = "We'd like to welcome you to our ISPO & OSPO demo platform. It's purpose is to demonstrate that ATOS has implemented these initiatives......    ";
//let freeTextContent = "";

// Charger le fichier textelibre.txt
(function loadFreeText() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '../js/textlibre.txt', true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      freeTextContent = xhr.responseText;
    }
  };
  xhr.onerror = function() {
    console.warn('Could not load textelibre.txt, using default text');
  };
  xhr.send();
})();

// Fonction pour animer le logo avec ondulation horizontale
function drawAnimatedLogo() {
  if (!logoImage) return;
  
  const tSec = performance.now() * 0.001;
  const dpr = window.devicePixelRatio || 1;
  const logoWidth = logoSourceWidth;
  const logoHeight = logoSourceHeight;
  const logoScale = 0.78;
  const drawWidth = logoWidth * logoScale;
  const drawHeight = logoHeight * logoScale;
  const offsetX = (logoWidth - drawWidth) * 0.5;
  const offsetY = (logoHeight - drawHeight) * 0.5;
  const lineHeight = 2; // hauteur de chaque découpe
  const waveAmp = 8; // amplitude de l'ondulation
  const waveFreq = 0.5; // fréquence de l'ondulation

  // Stabilise le rendu inter-navigateurs en tenant compte du ratio de pixels.
  const targetWidth = Math.round(logoWidth * dpr);
  const targetHeight = Math.round(logoHeight * dpr);
  if (logoCanvas.width !== targetWidth || logoCanvas.height !== targetHeight) {
    logoCanvas.width = targetWidth;
    logoCanvas.height = targetHeight;
    logoCanvas.style.width = logoWidth + 'px';
    logoCanvas.style.height = logoHeight + 'px';
  }

  logoCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  logoCtx.imageSmoothingEnabled = true;
  logoCtx.imageSmoothingQuality = 'high';
  
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
    logoCtx.drawImage(
      logoImage,
      0,
      0,
      logoSourceWidth,
      logoSourceHeight,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight
    );
    
    // Restaurer le contexte
    logoCtx.restore();
  }
}

// Fonction pour dessiner WELCOME au centre de l'ecran
function drawCenterWelcome() {
  const width = canvas2D.width;
  const height = canvas2D.height;
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const fontSize = Math.max(52, Math.min(140, Math.floor(width / 8)));
  const dotSpacing = Math.max(4, Math.floor(fontSize / 18));
  const dotRadius = Math.max(1.6, dotSpacing * 0.35);
  const cacheKey = width + "x" + height + "-" + fontSize + "-" + dotSpacing;

  // Regenerer la carte de points uniquement si la taille change
  if (drawCenterWelcome.cacheKey !== cacheKey) {
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext("2d");

    maskCtx.clearRect(0, 0, width, height);
    maskCtx.textAlign = "center";
    maskCtx.textBaseline = "middle";
    maskCtx.font = "900 " + fontSize + "px monospace";
    maskCtx.fillStyle = "#ffffff";
    maskCtx.fillText("WELCOME", centerX, centerY);

    const maskData = maskCtx.getImageData(0, 0, width, height).data;
    const points = [];
    const left = Math.max(0, Math.floor(centerX - fontSize * 3.8));
    const right = Math.min(width, Math.ceil(centerX + fontSize * 3.8));
    const top = Math.max(0, Math.floor(centerY - fontSize * 1.1));
    const bottom = Math.min(height, Math.ceil(centerY + fontSize * 1.1));

    for (let y = top; y < bottom; y += dotSpacing) {
      for (let x = left; x < right; x += dotSpacing) {
        const alpha = maskData[(y * width + x) * 4 + 3];
        if (alpha > 80) {
          points.push({ x, y });
        }
      }
    }

    drawCenterWelcome.cacheKey = cacheKey;
    drawCenterWelcome.points = points;
  }

  const points = drawCenterWelcome.points || [];
  const tSec = performance.now() * 0.001;
  const ampX = dotSpacing * 0.9;
  const ampY = dotSpacing * 0.7;

  ctx2D.shadowColor = "transparent";
  ctx2D.shadowBlur = 0;
  ctx2D.shadowOffsetX = 0;
  ctx2D.shadowOffsetY = 0;

  const grad = ctx2D.createLinearGradient(0, centerY - fontSize, 0, centerY + fontSize);
  grad.addColorStop(0, "#f2f2f2");
  grad.addColorStop(0.5, "#cecece");
  grad.addColorStop(1, "#2b2b2b");
  
  // Ombre des points
  ctx2D.fillStyle = "rgba(0, 0, 0, 0.35)";
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const phase = tSec * 2.2 + p.x * 0.018 + p.y * 0.022;
    const harmonicX = Math.sin(phase) * 0.7 + Math.cos(phase * 1.33) * 0.3;
    const harmonicY = Math.cos(phase * 0.93) * 0.65 + Math.sin(phase * 1.41) * 0.35;
    const zWave = Math.sin(phase * 1.18) * 0.6 + Math.cos(phase * 0.74) * 0.4;
    const depth = (zWave + 1.0) * 0.5;
    const px = p.x + harmonicX * ampX;
    const py = p.y + harmonicY * ampY;
    const r = dotRadius * (0.72 + depth * 0.6);

    ctx2D.beginPath();
    ctx2D.arc(px + 1.6, py + 1.6, r, 0, Math.PI * 2);
    ctx2D.fill();
  }

  // Points principaux
  ctx2D.fillStyle = grad;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const phase = tSec * 2.2 + p.x * 0.018 + p.y * 0.022;
    const harmonicX = Math.sin(phase) * 0.7 + Math.cos(phase * 1.33) * 0.3;
    const harmonicY = Math.cos(phase * 0.93) * 0.65 + Math.sin(phase * 1.41) * 0.35;
    const zWave = Math.sin(phase * 1.18) * 0.6 + Math.cos(phase * 0.74) * 0.4;
    const depth = (zWave + 1.0) * 0.5;
    const px = p.x + harmonicX * ampX;
    const py = p.y + harmonicY * ampY;
    const r = dotRadius * (0.76 + depth * 0.72);
    const alpha = 0.5 + depth * 0.5;

    ctx2D.globalAlpha = alpha;
    ctx2D.beginPath();
    ctx2D.arc(px, py, r, 0, Math.PI * 2);
    ctx2D.fill();
  }
  ctx2D.globalAlpha = 1;

  // Reinitialiser l'ombre pour les autres rendus
  ctx2D.shadowColor = "transparent";
  ctx2D.shadowBlur = 0;
  ctx2D.shadowOffsetX = 0;
  ctx2D.shadowOffsetY = 0;
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
    height - 250 + Math.sin(tSec * 2.4) * bobAmp
  );
  
  ctx2D.font = "bold " + fontSize + "px Verdana, Arial, Helvetica, sans-serif";
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

// Fonction pour dessiner le texte champ libre scrollant
function drawFreeText() {
  const freeText = freeTextContent;
  const tSec = performance.now() * 0.001;
  const width = canvas2D.width;
  const height = canvas2D.height;
  
  const fontSize = Math.max(24, Math.min(48, Math.floor(width / 20)));
  const charStep = fontSize ;
  const textWidth = charStep * freeText.length;
  const travel = width + textWidth + 200;
  const scrollSpeed = 100;
  const cyclePadding = 120;
  
  // Calcul de baseX pour scroller de droite à gauche
  const baseX = width + cyclePadding - (tSec * scrollSpeed) % travel;
  const baseY = height - 50;
  
  ctx2D.font = fontSize + "px Verdana, Arial, Helvetica, sans-serif";
  ctx2D.textBaseline = "middle";
  ctx2D.textAlign = "left";
  
  for (let i = 0; i < freeText.length; i++) {
    const ch = freeText[i];
    const letterX = baseX + i * charStep;
    const letterY = baseY;
    
    // Ombre
    ctx2D.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx2D.fillText(ch, letterX + 1, letterY + 1);
    
    // Texte en gradient
    const grad = ctx2D.createLinearGradient(letterX, letterY - fontSize * 0.5, letterX, letterY + fontSize * 0.5);
    grad.addColorStop(0, "#0073E6");
    grad.addColorStop(0.5, "#cecece");
    grad.addColorStop(1, "#0073E6");
    
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
  drawCenterWelcome();
  drawScrollText();
  drawFreeText();
  
  requestAnimationFrame(render);
}

render();