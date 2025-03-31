const amqp = require("amqplib");

async function receiveMessage() {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();
    await channel.assertQueue("orders");
    channel.consume("orders", (msg) => {
        console.log("Pedido recebido no estoque:", msg.content.toString());
        channel.ack(msg);
    });
}

receiveMessage();
