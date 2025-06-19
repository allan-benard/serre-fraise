from flask import Flask, request, jsonify
import serial, time

app = Flask(__name__)
ser = serial.Serial('COM5', 9600, timeout=1)  # adaptez votre COM

@app.route('/motor')
def motor():
    state = request.args.get('state')
    if state not in ('on','off'):
        return "Missing or invalid state", 400
    cmd = b'1' if state=='on' else b'0'
    ser.write(cmd)
    time.sleep(0.1)
    resp = ser.read_all().decode().strip()
    return jsonify(sent=state, reply=resp)

if __name__=='__main__':
    app.run(host='0.0.0.0', port=5000)
