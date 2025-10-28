from flask import Flask, render_template, jsonify, request
from prometheus_flask_exporter import PrometheusMetrics
import psutil
import os
import time
from datetime import datetime
import json

app = Flask(__name__)

# Initialize Prometheus metrics
metrics = PrometheusMetrics(app)

# Static information
app_info = {
    'name': 'DevOps GitOps Demo App',
    'version': os.environ.get('APP_VERSION', 'dev'),
    'build_time': os.environ.get('BUILD_TIME', datetime.now().isoformat()),
    'commit_sha': os.environ.get('COMMIT_SHA', 'unknown'),
    'environment': os.environ.get('ENVIRONMENT', 'development')
}

# Global counters
start_time = time.time()
request_count = 0

@app.before_request
def before_request():
    global request_count
    request_count += 1

@app.route('/')
def index():
    """Main dashboard page"""
    system_info = {
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_percent': psutil.disk_usage('/').percent,
        'uptime': time.time() - start_time,
        'request_count': request_count
    }
    
    return render_template('index.html', app_info=app_info, system_info=system_info)

@app.route('/health')
def health():
    """Health check endpoint"""
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'uptime_seconds': time.time() - start_time,
        'version': app_info['version'],
        'environment': app_info['environment']
    }
    
    # Simple health checks
    try:
        cpu_usage = psutil.cpu_percent()
        memory_usage = psutil.virtual_memory().percent
        
        if cpu_usage > 90 or memory_usage > 90:
            health_status['status'] = 'warning'
            health_status['warnings'] = []
            if cpu_usage > 90:
                health_status['warnings'].append(f'High CPU usage: {cpu_usage}%')
            if memory_usage > 90:
                health_status['warnings'].append(f'High memory usage: {memory_usage}%')
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['error'] = str(e)
    
    status_code = 200 if health_status['status'] in ['healthy', 'warning'] else 503
    return jsonify(health_status), status_code

@app.route('/version')
def version():
    """Version and build information"""
    return jsonify(app_info)

@app.route('/api/stats')
def stats():
    """API endpoint for system statistics"""
    try:
        stats = {
            'system': {
                'cpu_percent': psutil.cpu_percent(interval=0.1),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_percent': psutil.disk_usage('/').percent,
                'load_average': os.getloadavg() if hasattr(os, 'getloadavg') else [0, 0, 0]
            },
            'application': {
                'uptime_seconds': time.time() - start_time,
                'request_count': request_count,
                'version': app_info['version'],
                'environment': app_info['environment']
            },
            'timestamp': datetime.now().isoformat()
        }
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ready')
def ready():
    """Readiness probe for Kubernetes"""
    return jsonify({
        'status': 'ready',
        'timestamp': datetime.now().isoformat()
    })

@app.errorhandler(404)
def not_found(error):
    return render_template('error.html', 
                         error_code=404, 
                         error_message='Page not found'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('error.html', 
                         error_code=500, 
                         error_message='Internal server error'), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    print(f"Starting {app_info['name']} v{app_info['version']}")
    print(f"Listening on port {port}")
    print(f"Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
