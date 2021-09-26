const express = require('express');
const router = express.Router();
var AWS = require('aws-sdk');  //AWS
const fs = require('fs');
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

require('dotenv').config()


const app = express()


//Llamada a rekognition haciendo una referencia a ina imagen del bucket.
//Regresa un json con las etiquetas encontradas la imagen.
router.get('/labelsImage', (req, res) => {

    AWS.config.update({
        accessKeyId : "AKIATUNWZX3ZQPLKMF6T",
        secretAccessKey : "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",
        region:"us-east-1"
    });

    var params = {
        Image:{
            S3Object:{
                Bucket:"turing-bucket-1",
                Name:"tom-barrett-uiKqLsjusB0-unsplash.jpg"
            }
        }
    };

    //Call to aws rekorgnition
    const rekognition = new AWS.Rekognition();
    var labelsDetected ;
    //Detect labels
    rekognition.detectLabels(params, function(err,data){
        if (err)
            console.log(err,err.stack); //Error
        else {
            console.log(data);
            labelsDetected = data
        };
        res.end(JSON.stringify([data]));
            });

        
});

// OPERACION BUSQUEDA En el momento en el que el operador crea una operacion "busqueda"
//se crea el json correspondiente a la opercion
router.post('/search_operation',(req, res) => {

    //Recibe los datos de la operacion
    var alias_operation = req.body.alias;
    var status_operation = req.body.status;
    var date_operation= req.body.date;
    var description_operation = req.body.operation;
    var image_operation = req.body.image;
    var oficial_operation = req.body.oficial;
    var operator_operation = req.body.operator;

    // Guardar en la base de datos
    // Regresa el id con el que fue guardado

    console.log("Usuario guardado");
    res.end("ok");
    });


//Envia una notificacion sns a los usuarios
// TODO : verificar los numeros de telefono necesarios para la prueba
router.get('/SMS', (req, res) => {

    AWS.config.update({
        accessKeyId : "AKIATUNWZX3ZQPLKMF6T",
        secretAccessKey : "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",
        region:"us-east-2"
    });

    console.log("Message = " + req.query.message);
    console.log("Number = " + req.query.number);
    console.log("Subject = " + req.query.subject);
    var params = {
        Message: req.query.message,
        PhoneNumber: '+' + req.query.number,
        MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
                'DataType': 'String',
                'StringValue': req.query.subject
            }
        }
    };
    var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();
    publishTextPromise.then(
        function (data) {
            res.end(JSON.stringify({ MessageID: data.MessageId }));
        }).catch(
            function (err) {
                res.end(JSON.stringify({ Error: err }));
            });
});



//Envia una notificacion sns a los usuarios
// TODO : permitir que se ingrese texto deseaado
router.get('/Polly_alerta_rojo', (req, res) => {


    const Polly = new AWS.Polly({
        accessKeyId : "AKIATUNWZX3ZQPLKMF6T",
        secretAccessKey : "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",
        region:"us-east-1"
    })

    const input = {
        Text: "Hola a todas las unidades este es un mensaje de prueba",
        OutputFormat:"mp3",
        VoiceId: "Penelope"
    }

    Polly.synthesizeSpeech(input,(err,data)=>{
        if (err){
            console.log(err);
        }
        if(data.AudioStream instanceof Buffer){
            fs.writeFile('hellop.mp3', data.AudioStream,(fsErr)=>{
                if(fsErr){
                    console.error(err);

                }
                console.log("Success");
            })
        }
});

});



//Conectar a la base de datos
router.get('/database', (req, res) => {
var mysql = require('mysql');
var connection = mysql.createConnection({
  host: "turing-mysql.clpd65r8smk2.us-east-2.rds.amazonaws.com",
  user:"admin",
  password : "turingdb",
  port: "3306"
});
connection.connect(function(err) {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database.');
});
connection.end();
res.end("ok")
});


// Altas de imagenes a la base de datos
router.get('/database', (req, res) => {
    var mysql = require('mysql');
    var connection = mysql.createConnection({
      host: "turing-mysql.clpd65r8smk2.us-east-2.rds.amazonaws.com",
      user:"admin",
      password : "turingdb",
      port: "3306"
    });
    connection.connect(function(err) {
      if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
      }
      console.log('Connected to database.');
    });
    connection.end();
    res.end("ok")
    });




// Subir una sola imagen a un S3
router.post('/uploadImage', upload.single('image'), async (req, res) => {

    const file = req.file
    const fileStream = fs.createReadStream(file.path)


    

   const region = "us-east-1"
   const bucketName = "turing-bucket-1"
   const accessKeyId = "AKIATUNWZX3ZQCX2OLE7"
   const secretAccessKey = "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"

   const s3 = new AWS.S3({
   region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: 'v4'
  });

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename
  }

  const uploadURL = await s3.getSignedUrlPromise('putObject', uploadParams)
    res.send({uploadURL})

   
  });


// Obtener imagenes de S3
router.get('/getAllImages', async (req, res) => {

   //TODO: Acceso denegado a las imagemes, checar permisiso
   // Esta función regresa todas la imagenes que están almacenadas
   // en S3. Regresa un json con las imagenes y datos.
   // INFO: Para revisar el formato de salida de este servicio
   // puedes revisar en el navegador la ruta:
   // http://localhost:4000/getAllImages

   AWS.config.setPromisesDependency();
   const region = "us-east-1"
   const bucketName = "turing-bucket-1"
   const accessKeyId = "AKIATUNWZX3ZQCX2OLE7"
   const secretAccessKey = "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"
 
   const s3 = new AWS.S3({
   region,
   accessKeyId,
   secretAccessKey,
   signatureVersion: 'v4'
   });
 
   const response = await s3.listObjectsV2({
       Bucket: bucketName
       //Prefix: 'folde'
    }).promise();
    
   console.log(response);
   res.send({response})
   });



// Obtener las imagenes de coicnidencia con una etiqueta
router.get('/getAllImages', async (req, res) => {

    //TODO: Acceso denegado a las imagemes, checar permisiso
    // Esta función regresa todas la imagenes que están almacenadas
    // en S3. Regresa un json con las imagenes y datos.
    // INFO: Para revisar el formato de salida de este servicio
    // puedes revisar en el navegador la ruta:
    // http://localhost:4000/getAllImages
 
    AWS.config.setPromisesDependency();
    const region = "us-east-1"
    const bucketName = "turing-bucket-1"
    const accessKeyId = "AKIATUNWZX3ZQCX2OLE7"
    const secretAccessKey = "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"
  
    const s3 = new AWS.S3({
    region,
    accessKeyId,
    secretAccessKey,
    signatureVersion: 'v4'
    });
  
    const response = await s3.listObjectsV2({
        Bucket: bucketName
        //Prefix: 'folde'
     }).promise();
     
    console.log(response);
    res.send({response})
    });


// Leer todos los registros de la tabla "imagenes" en dynamo db
router.get('/getRegistros', async (req, res) => {
   // puedes revisar en el navegador la ruta:
    // http://localhost:4000/getRegistros
    AWS.config.update({
        accessKeyId : "AKIATUNWZX3ZQPLKMF6T",
        secretAccessKey : "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",
        region:"us-east-1"
    });

    const dotClient = new AWS.DynamoDB.DocumentClient();
    res.send("Dynamo corriendo")
    console.log("Dynamo corriendo")
    });

// Hacer una consulta a dynamo por id
router.get('/getRegistrosPorId', async (req, res) => {

    // TODO : permitir que el usuairo acceda id
    //Se puede consultar el servicio en:
    //http://localhost:4000/getRegistrosPorId?id=2

    AWS.config.update({
        accessKeyId : "AKIATUNWZX3ZQPLKMF6T",
        secretAccessKey : "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",
        region:"us-east-1"
    });

    const dotClient = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName:'imagenes',
        KeyConditionExpression:'id = :iduser',
        ExpressionAttributesValues:{
            ':iduser' : req.query.id
        }
    }
    const result = await dotClient.query(params)
    res.send("ok")
    console.log(result)
    });



// Subir elemento a la base de datos dynamo.
router.get('/subirRegistroDynamo', async (req, res) => {
    const { v4: uuidv4 } = require("uuid"); 
    // TODO : permitir que el usuairo acceda id
    //Se puede consultar el servicio en:
    //http://localhost:4000/subirRegistroDynamo?picture=testing&name=testing&labels=akjsndjans

    //El usurio solo sube la foto, primero se sube a S3, de S3 pasaa a Recognition
    // y recuperan las etiqutas, finalmente se guarda todo en Dynamo.

  // Paso 1: Subir la imagenes a S3

      AWS.config.update({
        accessKeyId : "AKIATUNWZX3ZQPLKMF6T",
        secretAccessKey : "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",
        region:"us-east-2"
    });
    

    var dynamoDB = new AWS.DynamoDB();
    var nuevoregistro = {
        "id":{"N":Math.floor(Math.random()).toString()},
        "picure":{"S":req.query.picture.toString()},
        "labels":{"S":req.query.labels.toString()},
        "date":{"S":new Date().toString()},
        "name":{"S":req.query.name.toString()},
    }

    var params= {
        "TableName":"imagenes",
        "Item":nuevoregistro
    };

    dynamoDB.putItem(params,function(err,data){
       if (err){
           console.error(err);
       }else{
           console.log("Registro guardado")
       }
    });

    res.send("registro guardado")

    });





router.post('/addTweet', (req, res) => {
    res.end('NA');
});

module.exports = router;