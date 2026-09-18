/* work.js
   THE FILE TO EDIT for content. One object per project, in the order they
   appear in the carousel:
   
     yr     the year shown on the card
     ttl    the title
     meta   the small grey line under the title
     draw   which glyph function from scenes.js paints its 3D scene
     yaw    the fixed camera for that scene, in radians.
     pitch  NEGATIVE looks DOWN at the scene, positive looks up from
            underneath — the far edge of a ground plane lands lower on
            screen as pitch goes negative.
     blurb  the paragraph in the open panel
     stack  the chips under the blurb
     links  optional [{ href, label }] shown as LABEL -> under the chips
     hue    the card's domain accent, pulled from the hero network's own
            hop palette (js/network.js HOP) so the card grid reads as an
            extension of that diagram rather than a separate colour system */

window.PF = window.PF || {};
(function (PF) {
  "use strict";

  const {
    glyphAgents, glyphHub, glyphTrajectory, glyphCamera,
    glyphSpider, glyphTars, glyphTodo, glyphDrone,
  } = PF;

  /* ── work data ──
     Each entry carries the one camera it is read from. Nothing orbits. */
  const WORK = [
    {
      yr: "2026", ttl: "Agentic Readiness Screener", meta: "AWS · individual",
      hue: "#8ab4f8",
      draw: glyphAgents, yaw: 0.62, pitch: 0.22,
      blurb: "Maps a customer's requirements and database schema to a feasibility verdict, then closes the gaps by asking the questions a consultant would ask. A deterministic engine issues the verdict; the agent only drives the loop.",
      stack: [
        "Python", "FastAPI", "Strands Agents", "Amazon Bedrock",
        "ECS Fargate", "Application Load Balancer", "Cloud Map",
        "API Gateway", "Cognito", "CloudFront", "NAT Gateway",
        "Internet Gateway", "Neptune", "OpenSearch",
      ],
    },
    {
      yr: "2026", ttl: "Knowledge-Sharing Hub", meta: "AWS · team",
      hue: "#8ab4f8",
      draw: glyphHub, yaw: 0.55, pitch: -0.22,
      blurb: "A platform that turns every recorded session into something searchable: transcript, slides, a highlight timeline, and a chatbot that answers from that session alone.",
      stack: [
        "Python", "Strands Agents", "Bedrock AgentCore", "Cohere Embed v4",
        "Lambda", "S3", "DynamoDB", "ECR", "SQS", "EventBridge", "SES",
        "OpenSearch", "Transcribe", "Rekognition", "CloudWatch",
        "React 19", "TypeScript",
      ],
    },
    {
      yr: "2025 – 26", ttl: "AeroLANCE UAV Navigation", meta: "AICPS Lab · research",
      hue: "#5ad1c4",
      draw: glyphTrajectory, yaw: 0.70, pitch: 0.30,
      blurb: "Brought a vision-language navigation architecture from simulation onto a physical drone, and built the evaluation harness that compares where it flew against where it should have.",
      stack: ["Python", "PyTorch", "OpenUAV", "TypeFly", "MonST3R", "Blender"],
      links: [
        { href: "assets/aerolance-research.pdf", label: "Research PDF" },
        { href: "https://github.com/sadmankiba/aerolance", label: "AeroLANCE project" },
      ],
    },
    {
      yr: "2026", ttl: "Speed Violation Tracker", meta: "computer vision",
      hue: "#e878b4",
      draw: glyphCamera, yaw: 0.52, pitch: -0.36,
      blurb: "A roadside camera pipeline that detects and tracks vehicles, estimates speed from a calibrated ground plane, and captures the ones over the limit.",
      stack: ["Python", "Ultralytics YOLO", "OpenCV", "Flask", "JavaScript", "SSE"],
      links: [
        { href: "https://github.com/HYSK-cmd/SpeedViolationTracker", label: "Repository" },
      ],
    },
    {
      yr: "2026", ttl: "Autonomous Spider Bot", meta: "reinforcement learning",
      hue: "#a48cf0",
      draw: glyphSpider, yaw: 0.60, pitch: -0.34,
      blurb: "A quadruped that looks before it commits. It walks in, stops at what is in its way, rakes the obstacle with its scanner, picks a line around it, and takes that line.",
      stack: ["Python", "PyTorch", "PPO", "PyBullet", "LiDAR", "IMU", "Jetson"],
      links: [
        { href: "assets/spider-bot.pdf", label: "Project PDF" },
        { href: "https://github.com/HYSK-cmd/Autonomous-Spider-Bot", label: "Repository" },
      ],
    },
    {
      yr: "2025 – 26", ttl: "ZotTARS", meta: "robotics · software subteam",
      hue: "#f0954a",
      draw: glyphTars, yaw: 0.58, pitch: -0.42,
      blurb: "A modular robotic assistant that spots an object, drives to it, and picks it up. Vision, voice and control each run as their own service behind a shared API, so the perception model or the controller can be swapped without touching the rest.",
      stack: ["Python", "FastAPI", "ROS-style services", "Ultralytics", "Arduino", "Raspberry Pi"],
    },
    {
      yr: "2025 – 26", ttl: "MyToDo", meta: "full stack",
      hue: "#f0c94a",
      draw: glyphTodo, yaw: 0.66, pitch: -0.40,
      blurb: "A task manager built the plain way: server-rendered pages, full CRUD, and a document store underneath. Small enough to hold the whole request path in your head.",
      stack: ["Python", "Flask", "Jinja2", "MongoDB", "PyMongo"],
      links: [
        { href: "https://github.com/HYSK-cmd/MyToDo", label: "Repository" },
      ],
    },
    {
      yr: "2025", ttl: "Drone Project", meta: "hardware · embedded",
      hue: "#f0954a",
      draw: glyphDrone, yaw: 0.62, pitch: -0.30,
      blurb: "A UAV built from parts: flight controller, ESCs, motors and GPS soldered and bench-validated, then tuned in ArduPilot and flown through autonomous waypoint missions over an ESP32 telemetry link.",
      stack: ["ArduPilot", "ESP32", "Embedded C", "Telemetry", "Soldering"],
    },
  ];

  PF.WORK = WORK;
})(window.PF);
