//Класс для управления реалмом

var Realm = require('realm');
    uuidv1 = require('uuid/v1');
    realmSchema = require('./realmSchema');
    TokenGenerator = require('uuid-token-generator');
    

var shopRealm = new Realm({
    path:'shop.realm',
    schema: realmSchema.myShopSchema,
    deleteRealmIfMigrationNeeded: true //Для нормальной отладки
});

//Генератор токена - мб понядобится
let tokGen = new TokenGenerator();

//Отдельный метод для вайпа всей базы
exports.wipeAll = function() {
    shopRealm.write(() => {
        shopRealm.deleteAll();
    })
}


//Регистрация пользователя
exports.signUp = function(login, email, password, callBak) {

    //Проверим пользовотеля по мылу !
    let user = shopRealm.objects('User').filtered('email == $0', email)[0];
    if (user) {
        callBak(undefined, 'пользователь с данным мылом уже существует = ' + email);
        return;
    }

    //Проверяем пользователя по логину
    user = shopRealm.objects('User').filtered('login == $0', login)[0];
    if (user) {
        callBak(undefined, 'Пользователь с данным логином уже есть = ' + login);
        return;
    }

    //Если все проверки пройдены
    let hashId = uuidv1();
    let currentTime = Date.now();
    let token = tokGen.generate();
    shopRealm.write(() =>{
        let user = shopRealm.create('User',{
            hashId: hashId,
            login: login,
            email: email,
            firstName: '',
            lastName: '',
            address: '',
            password: password,
            date: Math.round(currentTime/1000),
            token: token
        }, true);

        callBak(user);
    });
}


//Редактирование пользователя
exports.editUser = function(userHash, firstName, lastName, address, login, email, password, callBak) {

    //Если все проверки пройдены
    let hashId = userHash;
    let currentTime = Date.now();
    let token = tokGen.generate();
    shopRealm.write(() =>{
        let user = shopRealm.create('User',{
            hashId: hashId,
            login: login,
            email: email,
            firstName: firstName ? firstName : '',
            lastName: lastName ? lastName : '',
            address: address ? address : '',
            password: password,
            date: Math.round(currentTime/1000),
            token: token
        }, true);

        callBak(user);
    });
}


//Регистрация АДМИНА - логика такая
//Только тот кто знает сикрет кей - может стать админом
exports.toggleAdmin = function(userHashId, callBack) {
    shopRealm.write(() =>{
        let user = shopRealm.objects('User').filtered('hashId == $0', userHashId)[0];
        if (user) {
            //Пользователь найден
            if (user.isAdmin == true) {
                user.isAdmin = false;
            } else {
                user.isAdmin = true;
            }
            callBack(user);
        } else {
            callBack(undefined);
        }
    })
}


//Авторизация пользователя
exports.login = function(login, password, callBack) {
    shopRealm.write(() =>{
        let user = shopRealm.objects('User').filtered('login == $0', login)[0];
        if (user) {
            //Пользователь найден
            if (user.password == password) {
                //Пароли совпали
                let token = tokGen.generate();
                user.token = token;
                callBack(user, '');
            } else {
                //пароли не совпали
                callBack(undefined, 'Неверный пароль')
            }
        } else {
            callBack(undefined, 'Неверный логин')
        }
    })
}






//Получение пользователя по токену
exports.getUserByToken = function(token) {
    let user = shopRealm.objects('User').filtered('token == $0', token)[0];
    return user;
}





//Добавления Книги в магазин
exports.addBook = function(hashId, title, about, author, price, categoryName, genreList, image, userHashId, callBack) {
    
    //Проверим, есть ли подкатегория с таким именем как у поста
    let category = shopRealm.objects('Category').filtered('title == $0', categoryName)[0];
    if (!category) {
        callBack(undefined, 'нет категории с названием = ' + title);
        return;
    }

    if (!hashId) {
        hashId = uuidv1();
    }

    let currentTime = Date.now();

    shopRealm.write(() =>{
        let book = shopRealm.create('Book',{
            hashId: hashId,
            title: title,
            about: about,
            author: author,
            price: price,
            quantity: 1,
            genreList: genreList,
            image: image,
            categoryId: category.hashId,
            userHashId: userHashId,
            date: Math.round(currentTime/1000)
        }, true);

        callBack(book);
    });
}


//Удаление книги - Проверка на на админа
exports.deleteBook = function(bookHashId, user, callBack) {
    let book = shopRealm.objects('Book').filtered('hashId == $0', bookHashId)[0];
    if (!book) {
        callBack(undefined, 'нет книги с Id = ' + bookHashId)
        return;
    }
    
    if (user.isAdmin == true) {
        shopRealm.write(() => {
            shopRealm.delete(book);
            callBack('Успешное удаление книги!', 'lll')
        })
    } else {
        callBack(undefined, 'Недостаточно прав!')
    }
}


//Добавлении категории - МОЖЕТ ТОЛЬКО АДМИН
exports.addCategory = function(title, callBack) {

    let category = shopRealm.objects('Category').filtered('title == $0', title)[0];
    if (category) {
        callBack(undefined);
        return;
    }

    let hashId = uuidv1();

    shopRealm.write(() =>{
        let category = shopRealm.create('Category',{
            hashId: hashId,
            title: title,
        }, true);

        callBack(category);
    });
}

//Удаление категории и/или субкатегории - МОЖЕТ ТОЛЬКО АДМИН!!
//....


//Добавление покупки - после того как пользователь нажал на КУПИТЬ
exports.addPurchase = function(purchaseItemList, totalPrice, user, callBack) {

    let hashId = uuidv1();
    let currentTime = Date.now();



    shopRealm.write(() =>{

        let purchaseItemArr = [];
        purchaseItemList.forEach(element => {

            let book = shopRealm.objects('Book').filtered('hashId == $0', element.book.hashId)[0];

            let purchaseItem = shopRealm.create('PurchaseItem', {
                hashId: uuidv1(),
                book: book,
                counter: element.counter
            });
            purchaseItemArr.push(purchaseItem)
        });


        let purchase = shopRealm.create('Purchase',{
            hashId: hashId,
            purchaseItemList: purchaseItemArr,
            userHashId: user.hashId,
            totalPrice: totalPrice,
            date: Math.round(currentTime/1000) 
        }, true);

        callBack(purchase);
    });
}



//Получения списка со всеми книгами!!
exports.getAllBook = function() {
    let bookList = shopRealm.objects('Book').sorted('date', true);
    return bookList;
}

//Получение списка со всеми категориями
exports.getAllCategories = function() {
    let categoryList = shopRealm.objects('Category');
    return categoryList;
}

//Получение списка со всеми пользователями
exports.getAllUsers = function() {
    let userList = shopRealm.objects('User');
    return userList;
}

//Получения списка с покупками
//Либо покупки пользователя, либо все покупки - Если это админ
exports.getAllPurchases = function(user) {
    if (user.isAdmin === true) {
        let purchasesList = shopRealm.objects('Purchase').sorted('date', true);
        return purchasesList;
    } else {
        let purchasesList = shopRealm.objects('Purchase').filtered('userHashId == $0', user.hashId).sorted('date', true);
        return purchasesList;
    }


}