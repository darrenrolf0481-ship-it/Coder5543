export const PROJECT_TEMPLATES = {
  'python-web': {
    name: 'Python Web App',
    description: 'Web application powered by Flask and HTML5 template.',
    tags: ['python', 'flask', 'web'],
    files: [
      { id: 'root', name: 'Python_Web_Project', type: 'folder', parentId: null, isOpen: true },
      {
        id: 'app.py',
        name: 'app.py',
        type: 'file',
        parentId: 'root',
        language: 'python',
        content:
          'from flask import Flask, render_template\n\napp = Flask(__name__)\n\n@app.route("/")\ndef home():\n    return render_template("index.html")\n\nif __name__ == "__main__":\n    app.run(debug=True)',
      },
      { id: 'templates', name: 'templates', type: 'folder', parentId: 'root', isOpen: true },
      {
        id: 'index.html',
        name: 'index.html',
        type: 'file',
        parentId: 'templates',
        language: 'html',
        content:
          '<!DOCTYPE html>\n<html>\n<head>\n    <title>Neural Web App</title>\n</head>\n<body style="background: #050101; color: #fecaca; font-family: sans-serif; padding: 2rem;">\n    <h1>Neural Interface Active</h1>\n    <p>Welcome to the Crimson OS web portal.</p>\n</body>\n</html>',
      },
      { id: 'static', name: 'static', type: 'folder', parentId: 'root', isOpen: false },
      {
        id: 'style.css',
        name: 'style.css',
        type: 'file',
        parentId: 'static',
        language: 'css',
        content: 'body { margin: 0; }',
      },
    ],
  },
  'rust-cli': {
    name: 'Rust CLI Tool',
    description: 'A command-line interface tool implemented in Rust.',
    tags: ['rust', 'cli', 'system'],
    files: [
      { id: 'root', name: 'Rust_CLI_Project', type: 'folder', parentId: null, isOpen: true },
      { id: 'src', name: 'src', type: 'folder', parentId: 'root', isOpen: true },
      {
        id: 'main.rs',
        name: 'main.rs',
        type: 'file',
        parentId: 'src',
        language: 'rust',
        content:
          'use std::io;\n\nfn main() {\n    println!("Neural CLI Initialized.");\n    println!("Enter command:");\n    let mut input = String::new();\n    io::stdin().read_line(&mut input).unwrap();\n    println!("Executing: {}", input.trim());\n}',
      },
      {
        id: 'cargo.toml',
        name: 'Cargo.toml',
        type: 'file',
        parentId: 'root',
        language: 'toml',
        content:
          '[package]\nname = "neural-cli"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]',
      },
    ],
  },
  'neural-module': {
    name: 'Neural Module',
    description: 'Pre-configured template for developing neural brain modules.',
    tags: ['python', 'neural', 'brain'],
    files: [
      { id: 'root', name: 'Neural_Module', type: 'folder', parentId: null, isOpen: true },
      {
        id: 'core.py',
        name: 'core.py',
        type: 'file',
        parentId: 'root',
        language: 'python',
        content:
          'class NeuralModule:\n    def __init__(self):\n        self.active = True\n\n    def run(self):\n        print("Neural Module Running...")\n\nif __name__ == "__main__":\n    module = NeuralModule()\n    module.run()',
      },
      {
        id: 'config.json',
        name: 'config.json',
        type: 'file',
        parentId: 'root',
        language: 'json',
        content:
          '{\n  "module_name": "NeuralCore",\n  "version": "1.0.0",\n  "permissions": ["vault", "vision"]\n}',
      },
    ],
  },
};
