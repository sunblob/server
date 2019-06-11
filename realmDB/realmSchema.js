//Схема БД

exports.myShopSchema = [

    {
        name: 'User',
        primaryKey: "hashId",
        properties: {
            hashId: 'string',
            login: 'string',
            email: 'string',
            firstName: 'string',
            lastName: 'string',
            password: 'string',
            address: 'string',
            token: 'string',
            date: 'int', //Дата регистрации - ТОЖЕ ХРАНИМ В СЕКУНДАХ!!!
            isAdmin: { type : 'bool', default: false} //Тип пользователя - Админ или нет
        }
    },

    {
        name: 'Book',
        primaryKey: 'hashId',
        properties:{
            hashId: 'string',
            title: 'string',
            about: 'string',
            author: 'string', //Автор книги
            price: 'int',
            quantity: 'int',
            genreList: 'string[]', //Массив с жанрами у книги
            image: 'string',
            categoryId: 'string', //Ссылка на подкатегорию к которой он относится
            userHashId: 'string',
            date: 'int'
        }
    },

    //Категории
    {
        name: 'Category',
        primaryKey: 'hashId',
        properties: {
            hashId: 'string',
            title: 'string',
        }
    },

    //Покупки
    {
        name: 'Purchase',
        primaryKey: 'hashId',
        properties: {
            hashId: 'string',
            purchaseItemList: 'PurchaseItem[]', //Все книги которые были в этой покупке
            userHashId: 'string', //Id пользователя который совершил эту покупку
            totalPrice: 'int', //Финальная цена
            date: 'int'
        }
    },

    //Элемент покупки
    {
        name: 'PurchaseItem',
        primaryKey: 'hashId',
        properties: {
            hashId: 'string',
            book: 'Book', //Одна книга
            counter: 'int' //Количество этих книг
        }
    }

]