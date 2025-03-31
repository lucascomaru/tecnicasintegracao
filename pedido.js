const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

amqp.connect('amqp://localhost', (err, conn) => {
  if (err) {
    console.error('Falha ao conectar! ', err);
    return;
  }

  conn.createChannel((err, channel) => {
    if (err) {
      console.error('Falha ao criar canal !:', err);
      return;
    }

    const queue = 'pedidos';
    channel.assertQueue(queue, { durable: false });

    app.get('/', (req, res) => {
      res.send(`
        <html>
          <body>
            <h1>Fazer Pedido</h1>
            <form id="pedidoForm">
              <label for="produto">Produto:</label><br>
              <input type="text" id="produto" name="produto" required><br><br>
              <label for="quantidade">Quantidade:</label><br>
              <input type="number" id="quantidade" name="quantidade" required><br><br>
              <input type="submit" value="Enviar Pedido">
            </form>
            <script>
              document.getElementById("pedidoForm").addEventListener("submit", function(event) {
                event.preventDefault();
                
                const produto = document.getElementById("produto").value;
                const quantidade = document.getElementById("quantidade").value;

                fetch("/order", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    produto: produto,
                    quantidade: quantidade
                  })
                })
                .then(response => response.text())
                .then(data => alert(data))
                .catch(error => console.error("Erro:", error));
              });
            </script>
          </body>
        </html>
      `);
    });

    app.post('/order', (req, res) => {
      const { produto, quantidade } = req.body;

      if (!produto || !quantidade) {
        return res.status(400).send('Produto e quantidade são obrigatórios');
      }

      const pedido = { produto, quantidade };
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(pedido)));

      res.send(`Pedido enviado! ${JSON.stringify(pedido)}`);
      console.log('Pedido enviado! :', pedido);
    });

    app.listen(port, () => {
      console.log(`API de Pedidos rodando na porta ${port}`);
    });
  });
});
