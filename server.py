import os, httpx, uvicorn, json, math, time, asyncio, subprocess, sys, zipfile, shutil
from fastapi import FastAPI, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

# Add Nucleoid to path
nucleoid_path = os.path.join(os.getcwd(), "Nucleoid", "src")
if nucleoid_path not in sys.path:
    sys.path.append(nucleoid_path)

try:
    from nucleoid.runtime import runtime_instance
    NUCLEOID_AVAILABLE = True
except ImportError:
    NUCLEOID_AVAILABLE = False

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SENSORS = {
    "magnetometer": "qmc630x Magnetometer Non-wakeup",
    "gyroscope":    "icm4x6xx Gyroscope Non-wakeup",
    "accelerometer":"icm4x6xx Accelerometer Non-wakeup",
    "pressure":     "icp201xx Pressure Sensor Non-wakeup",
    "light":        "stk_stk3bfx Ambient Light Sensor Non-wakeup",
    "proximity":    "stk_stk3bfx Proximity Sensor Non-wakeup",
}

class CommandRequest(BaseModel):
    command: str

class LogicRequest(BaseModel):
    code: str

class LintRequest(BaseModel):
    code: str

class BenchmarkRequest(BaseModel):
    code1: str
    code2: str
    iterations: Optional[int] = 1000

@app.get("/api/rules")
async def list_rules():
    """
    Retrieves a list of all system rules and coding standards defined in the rules directory.
    
    Returns:
        List[Dict[str, str]]: A list of rule objects containing formatted names and paths.
    """
    try:
        rules_dir = "rules"
        if not os.path.exists(rules_dir):
            return []
        rules = []
        for f in os.listdir(rules_dir):
            if f.endswith(".md"):
                rules.append({"name": f.replace("-", " ").replace(".md", "").title(), "path": f})
        return rules
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/rules/get")
async def get_rule(path: str):
    """
    Fetches the full markdown content of a specific system rule.
    
    Args:
        path (str): The filename of the rule to retrieve.
        
    Returns:
        Dict[str, str]: Content of the rule or an error message.
    """
    try:
        full_path = os.path.join("rules", path)
        if not os.path.exists(full_path):
            return {"error": "File not found"}
        with open(full_path, 'r') as f:
            content = f.read()
        return {"content": content}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/algo/categories")
async def get_algo_categories():
    """
    Lists all available algorithm categories from the local knowledge pack.
    
    Returns:
        List[str]: A list of category names.
    """
    try:
        with open("algorithms_knowledge_pack.json", 'r') as f:
            pack = json.load(f)
        return list(pack["categories"].keys())
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/algo/list")
async def list_algorithms(category: str):
    """
    Retrieves all algorithms belonging to a specific category.
    
    Args:
        category (str): The name of the category to filter by.
        
    Returns:
        List[Dict]: A list of algorithm metadata objects.
    """
    try:
        with open("algorithms_knowledge_pack.json", 'r') as f:
            pack = json.load(f)
        if category in pack["categories"]:
            return pack["categories"][category]
        return []
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/algo/search")
async def search_algorithms(q: str):
    try:
        with open("algorithms_knowledge_pack.json", 'r') as f:
            pack = json.load(f)
        
        results = []
        q = q.lower()
        for cat, algos in pack["categories"].items():
            for algo in algos:
                if q in algo["name"].lower() or q in cat.lower():
                    results.append({
                        "category": cat,
                        "name": algo["name"],
                        "path": algo["path"]
                    })
        return results[:50] # Limit results
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/algo/get")
async def get_algorithm(path: str):
    try:
        full_path = os.path.join("python_algorithms", path)
        if not os.path.exists(full_path):
            return {"error": "File not found"}
        with open(full_path, 'r') as f:
            content = f.read()
        return {"content": content}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/benchmark")
async def benchmark_code(req: BenchmarkRequest):
    import timeit
    try:
        # Use a safe execution environment for benchmarking
        # Note: This is simplified; in a real app, use a proper sandbox
        t1 = timeit.timeit(req.code1, number=req.iterations)
        t2 = timeit.timeit(req.code2, number=req.iterations)
        
        return {
            "code1_time": t1,
            "code2_time": t2,
            "winner": "code1" if t1 < t2 else "code2",
            "diff": abs(t1 - t2),
            "percent": (abs(t1 - t2) / max(t1, t2)) * 100 if max(t1, t2) > 0 else 0
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/validate")
async def validate_code(req: LintRequest):
    import ast
    try:
        ast.parse(req.code)
        return {"status": "valid", "msg": "Neural syntax validated. All nodes synchronized."}
    except SyntaxError as e:
        return {
            "status": "error", 
            "msg": f"CRITICAL ERROR: {e.msg} (Line {e.lineno})",
            "line": e.lineno,
            "offset": e.offset
        }
    except Exception as e:
        return {"status": "error", "msg": f"SYSTEM FAILURE: {str(e)}"}

async def read_sensor(name: str):
    try:
        proc = await asyncio.create_subprocess_exec(
            "termux-sensor", "-n", "1", "-s", name,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        try:
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=2.0)
        except asyncio.TimeoutError:
            proc.kill()
            return None
        if stdout:
            data = json.loads(stdout.decode())
            key = list(data.keys())[0]
            return data[key].get("values", [])
    except Exception:
        pass
    return None

@app.get("/api/vitals")
async def get_vitals():
    try:
        res = subprocess.check_output(["termux-battery-status"], stderr=subprocess.DEVNULL)
        battery = json.loads(res.decode())
    except:
        battery = {"percentage": 0, "temperature": 0}
    
    return {
        "mem_load": 72,
        "thermals": battery.get("temperature", 0),
        "battery": battery.get("percentage", 0),
        "timestamp": time.time(),
        "nucleoid": NUCLEOID_AVAILABLE
    }

@app.get("/api/sensors")
async def get_sensors():
    out = {"timestamp": time.time() * 1000, "source": "termux_hardware"}
    mag = await read_sensor("magnetometer")
    if mag and len(mag) >= 3:
        out["magnetometer"] = {"x": round(mag[0],3), "y": round(mag[1],3), "z": round(mag[2],3)}
    
    light = await read_sensor("light")
    if light:
        out["light"] = {"lux": round(light[0], 1)}
        
    return out

@app.get("/api/files/list")
async def list_project_files(path: str = "."):
    """
    Lists files in the project directory for the editor's file tree.
    """
    try:
        # Prevent path traversal
        abs_path = os.path.abspath(os.path.join(os.getcwd(), path))
        if not abs_path.startswith(os.getcwd()):
            return {"error": "Unauthorized path access"}
        
        if not os.path.exists(abs_path):
            return []
            
        items = []
        for f in os.listdir(abs_path):
            if f.startswith('.') and f != '.gitignore': continue # Skip hidden files
            full_path = os.path.join(abs_path, f)
            rel_path = os.path.relpath(full_path, os.getcwd())
            is_dir = os.path.isdir(full_path)
            items.append({
                "id": rel_path,
                "name": f,
                "type": "folder" if is_dir else "file",
                "parentId": os.path.relpath(abs_path, os.getcwd()) if abs_path != os.getcwd() else None,
                "path": rel_path
            })
        return items
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/files/read")
async def read_project_file(path: str):
    """
    Reads the content of a project file.
    """
    try:
        abs_path = os.path.abspath(os.path.join(os.getcwd(), path))
        if not abs_path.startswith(os.getcwd()):
            return {"error": "Unauthorized path access"}
            
        if not os.path.exists(abs_path) or os.path.isdir(abs_path):
            return {"error": "File not found"}
            
        with open(abs_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        return {"content": content, "path": path}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/files/save")
async def save_project_file(req: LogicRequest, path: str):
    """
    Saves content to a file. (Using LogicRequest as it contains a 'code' field)
    """
    try:
        abs_path = os.path.abspath(os.path.join(os.getcwd(), path))
        if not abs_path.startswith(os.getcwd()):
            return {"error": "Unauthorized path access"}
            
        with open(abs_path, 'w', encoding='utf-8') as f:
            f.write(req.code)
        return {"status": "success", "path": path}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/uploads/list")
async def list_uploads():
    """
    Lists all files currently stored in the uploads directory.
    
    Returns:
        List[Dict]: A list of file metadata objects.
    """
    try:
        upload_dir = "uploads"
        if not os.path.exists(upload_dir):
            return []
        
        files = []
        for root, dirs, filenames in os.walk(upload_dir):
            for f in filenames:
                full_path = os.path.join(root, f)
                stats = os.stat(full_path)
                rel_path = os.path.relpath(full_path, upload_dir)
                files.append({
                    "name": f,
                    "path": rel_path,
                    "size": f"{stats.st_size / (1024 * 1024):.2f}MB" if stats.st_size < 1024 * 1024 * 1024 else f"{stats.st_size / (1024 * 1024 * 1024):.2f}GB",
                    "type": f.split('.')[-1] if '.' in f else "unknown",
                    "date": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(stats.st_mtime))
                })
        return files
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        upload_dir = "uploads"
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
            
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # If it's a zip, extract it
        extracted_files = []
        if file.filename.endswith(".zip"):
            extract_path = os.path.join(upload_dir, file.filename.replace(".zip", ""))
            if not os.path.exists(extract_path):
                os.makedirs(extract_path)
            
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
                
            # List extracted files
            for root, dirs, files in os.walk(extract_path):
                for f in files:
                    rel_path = os.path.relpath(os.path.join(root, f), extract_path)
                    extracted_files.append(rel_path)
                    
        return {
            "status": "success",
            "filename": file.filename,
            "path": file_path,
            "extracted": extracted_files,
            "msg": f"File {file.filename} processed and indexed for neural retrieval."
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/terminal")
async def run_command(req: CommandRequest):
    try:
        proc = await asyncio.create_subprocess_shell(
            req.command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()
        return {
            "stdout": stdout.decode(),
            "stderr": stderr.decode(),
            "exit_code": proc.returncode
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/logic")
async def run_logic(req: LogicRequest):
    if not NUCLEOID_AVAILABLE:
        return {"error": "Nucleoid Logic Engine not initialized."}
    
    try:
        # Nucleoid process is synchronous, run in thread to avoid blocking
        loop = asyncio.get_event_loop()
        details = await loop.run_in_executor(None, lambda: runtime_instance.process(req.code, {'details': True}))
        return details
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
