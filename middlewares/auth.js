//Importar dependencias
const JWT = require('jwt-simple');
const moment = require('moment');

//Importar clave secreta
const libjwt = require('../services/jwt');
const secret = libjwt.secret;

//Funcion de autenticacion
exports.auth=(req,res,next) => {
    //Comprobar si llega la cabecera de autenticacion
    if(!req.headers.authorization){
        return res.status(403).send({
            message: 'La peticion no tiene la cabecera de autenticacion'
        });
    }

    //Limpiar el token
    let token = req.headers.authorization.replace(/['"]+/g, '');

    //Decodificar el Token 
    try {
        var payload = JWT.decode(token, secret);

        //Comprobar la expiracion del token
        if(payload.exp <= moment().unix()){
            return res.status(401).send({
                message: 'El token ha expirado'
            });
        }

        //Agregar datos de usuario a request
        req.user = payload;

        //Comprobar si el token ha expirado
        if(payload.exp <= moment().unix()){
            return res.status(404).send({
                error: error,
                message: 'El token ha expirado'
            });
        }
    } catch (error) {
        return res.status(404).send({
            status: error,
            mensaje: "Token invalido",
            error: error 
        })
    }



    //pasar a la ejecucion de la accion
    next();
}

