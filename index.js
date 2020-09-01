import AWSXRay from 'aws-xray-sdk';
import EventEmitter from 'events';

AWSXRay.enableAutomaticMode();

function simulateCPUOperations (caller) {
  let result = 0;
  for (var i = Math.pow(2, 7); i >= 0; i--) {
    result += Math.atan(i) * Math.tan(i);
  }
  console.info(`[${caller}] CPU`, result);
}

function simulateIOOperations (caller) {
  const query = function databaseQuery () {
    return new Promise((resolve) => setTimeout(resolve), Math.random() * 5000);
  }
  return query().then(() => console.log(`[${caller}] IO`));
}

class KafkaListener1 extends EventEmitter {
  constructor() {
    super();
    this.on('message', this.onMessage);
  }

  async onMessage(_message) {
    const segment = new AWSXRay.Segment('KafkaListener1::OnMessage');
    const ns = AWSXRay.getNamespace();

    ns.run(async () => {
      AWSXRay.setSegment(segment);
      simulateCPUOperations(this.constructor.name);
      await simulateIOOperations(this.constructor.name);
      console.log(`[${this.constructor.name}] Finished message handler`);
      segment.close();
    });
  }
}

class KafkaListener2 extends EventEmitter {
  constructor() {
    super();
    this.on('message', this.onMessage);
  }

  async onMessage(_message) {
    const segment = new AWSXRay.Segment('KafkaListener2::OnMessage');
    const ns = AWSXRay.getNamespace();

    ns.run(async () => {
      AWSXRay.setSegment(segment);
      simulateCPUOperations(this.constructor.name);
      await simulateIOOperations(this.constructor.name);
      console.log(`[${this.constructor.name}] Finished message handler`);
      segment.close();
    });
  }
}

const listeners = [new KafkaListener1(), new KafkaListener2()];
listeners.map(async (listener) => {
  for (let i = 0; i < 1; ++i) {
    listener.emit('message', i);
  }
});
