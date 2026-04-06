function errorMiddleware(error, req, res, next) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Erro interno do servidor';

    return res.status(statusCode).json({
        error: true,
        message,
    });
}

module.exports = errorMiddleware;