//Самый главный файл - вот тут идет принятие всех запросов и отправка ответов!!!

const port = 5000; //Константа для порта

var express = require('express'); 
    realmHelper = require('./realmDB/realmHelper');
    fileUpload = require('express-fileupload');
    uuidv1 = require('uuid/v1');
    cors = require('cors');
    ip = require('ip');
    


var app = express();

app.use(cors());
app.use(express.json()); 
app.use(fileUpload());
app.use('/images', express.static(__dirname + '/images'));

// var server = require('http').createServer(app);


//Тестовый запрос
app.post('/test', function(req, res) {
    console.log(req);
    res.json({message:"ok"})
});

//метод для вайпа базы
app.post('/wipeAll', function(req, res) {
    realmHelper.wipeAll();
    res.json({message:'WipedAll!'});
});


//Список с роутерами
let routerList = [
    'signUp',
    'editUser',
    'login',
    'toggleAdmin',  
    'addBook',
    'deleteBook', 
    'addPurchase', 
    'addCategory',
    'deleteCategory', 
    'getAllBook',
    'getAllCategories',
    'getAllUsers',
    'getAllPurchases'];

//ОСНОВНОЙ ЗАПРОС!!!!!!!!!!!!!!!!!!!!!!!!!!
app.post('/mainPost',function(req,res){
    if (!req.body) { 
        console.log('Пришел пустой запрос');
        res.status(500).json({error: 'Пришел пустой запрос' }).end();
        return; 
    } 
    if (!req.body.router){
        res.status(500).json({error:'не был отправлен роутер', avaliableRouters: routerList}).end();
        return;
    }


    let router = req.body.router;
    //Проверка на то что роутер корректный
    if (!routerList.includes(router)) {
        res.status(500).json({error:'Некорректный роутер', avaliableRouters: routerList}).end();
        return;
    }

    
    //И только после того как пройдены все начальные проверки - мы идем в выбор действия - что делаем
    
    switch(router) {

        //Редактирование пользователя
        case 'signUp':{
            if (!req.body.login || !req.body.email || !req.body.password){
                res.status(500).json({error: 'Одно из полей не было отправлено'}).end();
                return;
            }


            let login = req.body.login;
            email = req.body.email;
            password = req.body.password;

            //Записываем его в БД и ставим замыкание
            realmHelper.signUp(login, email, password, function(user, msg){
                if (!user) {
                    res.status(500).json({error: msg}).end();
                } else {
                    res.json(user);
                }
            });
            break;
        }

        //Редактирование пользователя
        case 'editUser':{

            if (!req.body.token) {
                res.status(500).json({error: 'Для этой операции требуется токен!'}).end();
                return;
            }

            //Сразу проверим пользователя - получаем пользователя по токену
            let user = realmHelper.getUserByToken(req.body.token);
            if (!user) {
                res.status(500).json({error: 'Токен недействителен!'}).end();
                return;
            }

            let firstName = req.body.firstName;
                lastName = req.body.lastName;
                address = req.body.address;
                login = req.body.login;
                email = req.body.email;
                password = req.body.password;

            //Записываем его в БД и ставим замыкание
            realmHelper.editUser(user.hashId, firstName, lastName, address, login, email, password, function(user, msg){
                if (!user) {
                    res.status(500).json({error: msg}).end();
                } else {
                    res.json(user);
                }
            });
            break;
        }


        //Авторизация пользователя
        case 'login':{
            if (!req.body.login || !req.body.password){
                res.status(500).json({error: 'Одно из полей не было отправлено'}).end();
                return;
            }

            console.log(req.body);

            let login = req.body.login;
                password = req.body.password;

            //Записываем пользователя в БД и ставил КоллБэк
            realmHelper.login(login, password, function(user, msg){
                if(!user) {
                    res.status(500).json({error: msg}).end();
                } else {
                    res.json(user);
                }
            });
            break;
        }

        //Добавление книги
        case 'addBook':{
            console.log(req.body)
            if (!req.body.token) {
                res.status(500).json({error: 'Для этой операции требуется токен!'}).end();
                return;
            }

            //Сразу проверим пользователя - получаем пользователя по токену
            let user = realmHelper.getUserByToken(req.body.token);
            if (!user) {
                res.status(500).json({error: 'Токен недействителен!'}).end();
                return;
            }

            if (!req.body.title || !req.body.about || !req.body.author ||
                !req.body.price || !req.body.genreList || !req.body.categoryName){
                res.status(500).json({error: 'Одно из полей не было отправлено'}).end();
                return;
            }

            let title = req.body.title;
                about = req.body.about;
                author = req.body.author;
                price = +req.body.price;
                categoryName = req.body.categoryName;
                genreList = req.body.genreList;
                image = req.body.photo;
                hashId = req.body.hashId;

            if (image) {
                realmHelper.addBook(hashId, title, about, author, price, categoryName, genreList, image, user.hashId, function(book, msg){
                    if (!book) {
                        res.status(500).json({error: msg}).end();
                    } else {
                        res.json(book);
                    }
                });

            } else {
                let sampleFile = req.files.image;
                //Грузим фотку на сервак
                uploadFile(sampleFile, function(result) {
                    if (result=='error'){
                        res.status(500).json({error: 'Ошибка в загрузке фотки'});
                        return;
                    }

                    realmHelper.addBook(title, about, author, price, categoryName, genreList, result, user.hashId, function(book, msg){
                        if (!book) {
                            res.status(500).json({error: msg}).end();
                        } else {
                            res.json(book);
                        }
                    });
                })
            }
            break;
        }

        //Удаление книги
        case 'deleteBook':{
            if (!req.body.token) {
                res.status(500).json({error: 'Для этой операции требуется токен!'}).end();
                return;
            }

            let user = realmHelper.getUserByToken(req.body.token);
            if (!user) {
                res.status(500).json({error: 'Токен недействителен!'}).end();
                return;
            }

            if (!req.body.bookId) {
                res.status(500).json({error: 'Одно из полей не было отправлено'}).end();
                return;
            }

            let bookHashId = req.body.bookId;

            realmHelper.deleteBook(bookHashId, user, function(result, msg){
                if (!result) {
                    res.status(500).json({error:msg}).end();
                } else {
                    res.json({message:result});
                }
            });

            break;
        }


        //Добавлении категории
        case 'addCategory':{
            if (!req.body.token) {
                res.status(500).json({error: 'Для этой операции требуется токен!'}).end();
                return;
            }

            //Сразу проверим токен - получаем пользователя по токену
            let user = realmHelper.getUserByToken(req.body.token);
            if (!user) {
                res.status(500).json({error: 'Токен недействителен!'}).end();
                return;
            }
            if (user.isAdmin == false) {
                res.status(500).json({error: 'У данного пользователь недостаточно прав!'}).end();
                return;
            }

            if (!req.body.title){
                res.status(500).json({error: 'Одно из полей не было отправлено'}).end();
                return;
            }

            let title = req.body.title;

                realmHelper.addCategory(title, function(category){
                    if (!category) {
                        res.status(500).json({message: 'Категория с таким именем уже есть! = ' + title}).end();
                    } else {
                        res.json({message: 'Успешно создали кАТЕГОРИЮ', category : category}).end();
                    }
            });
            break;
        }

        //Метод для добавления покупки - когда пользователь в корзине ее нажал
        case 'addPurchase':{
            if (!req.body.token) {
                res.status(500).json({error: 'Для этой операции требуется токен!'}).end();
                return;
            }

            //Сразу проверим токен - получаем пользователя по токену
            let user = realmHelper.getUserByToken(req.body.token);
            if (!user) {
                res.status(500).json({error: 'Токен недействителен!'}).end();
                return;
            }

            if (!req.body.purchaseItemList || !req.body.totalPrice){
                res.status(500).json({error: 'Одно из полей не было отправлено'}).end();
                return;
            }

            console.log('ПОКУПКА')
            console.log(req.body)

            let purchaseItemList = req.body.purchaseItemList;
                totalPrice = +req.body.totalPrice;

            realmHelper.addPurchase(purchaseItemList, totalPrice, user, function(purchase){
                res.json({message: 'Успешная покупка', purchase : purchase}).end();
            });

            break
        }



        //Получение списка с постами
        case 'getAllBook':{
            let bookList = realmHelper.getAllBook();
            let bookArr = [];
            bookList.forEach(element => {
                bookArr.push(element)
            });
            res.json(bookArr);
            break;
        }

        //Получения списка со всеми категориями
        case 'getAllCategories':{
            let categoryList = realmHelper.getAllCategories();
            let categoryArr = [];
            categoryList.forEach(element => {
                categoryArr.push(element);
            })

            res.json(categoryArr);
            break;
        }

        //Метод вывода всех пользователей из БД
        case 'getAllUsers':{
            let userList = realmHelper.getAllUsers();
            let userArr = [];

            userList.forEach(element => {
                userArr.push(element)
            });
            res.json(userArr);
            break;
        }

        //Получение списка со всеми покупками
        case 'getAllPurchases':{

            console.log('Что то там ' + req.body);


            if (!req.body.token) {
                res.status(500).json({error: 'Для этой операции требуется токен!'}).end();
                return;
            }

            //Сразу проверим токен - получаем пользователя по токену
            let user = realmHelper.getUserByToken(req.body.token);
            if (!user) {
                res.status(500).json({error: 'Токен недействителен!'}).end();
                return;
            }

            let purchaseList = realmHelper.getAllPurchases(user);
            let purchaseArr = [];
            purchaseList.forEach(element => {
                purchaseArr.push(element)
            });
            res.json(purchaseArr);
            break;
        }
    }



});


//Создаем админа!!
app.post('/toggleAdmin', function(req, res){

    if (!req.body.secretKey) {
        res.status(500).json({error: 'НЕТ СЕКРЕТНОГО КЛЮЧА'}).end();
        return;
    }

    if (!req.body.hashId) {
        res.status(500).json({error: 'Не отправлен hashId пользователя'}).end();
        return;
    }

    let hashId = req.body.hashId;
        secretKey = req.body.secretKey;

    if (secretKey != 'makeAdmin') {
        res.status(500).json({error: 'СОРРИ, Неправильный ключ'}).end();
        return;
    }

    realmHelper.toggleAdmin(hashId, function(user){
        if(user) {
            res.json({message : 'Теперь этот пользователь админ', user : user})
        } else {
            res.status(500).json({message : 'Нет пользователя с hashId = ' + hashId});
        }
    })
});



//один метод - который отвечает за все фотки !!!
function uploadFile(sampleFile, callback){
    let id = uuidv1() +'.jpg';
    sampleFile.mv('./images/' + id, function(err) // если функция мв вернет ошибку,то сработает замыкание
    {
      if (err) {
        console.log('ошибка = ' + err);
        callback('error');
        return;
      }

      callback('http://localhost:' + port +'/images/' + id);
    });
}

//Метод для загрузки фотки на сервак и получения ее HashId

app.post('/uploadPhoto', function(req, res) {
    console.log(req.body);

    // console.log(req.files.file);

    let sampleFile = req.files.file;

    uploadFile(sampleFile, function(result){
        if (result=='error'){
            res.status(500).json({error: 'Ошибка в загрузке фотки'})
            return;
        }
        res.json({message:result});
    })
})




app.listen(port, function(){
    console.log(`Example app listening on port ${port}!`);
});