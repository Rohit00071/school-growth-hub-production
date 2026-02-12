
import app from './app';
console.log('App imported successfully');
const server = app.listen(4001, () => {
    console.log('Server started on 4001');
    server.close();
});
