const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const e = require('express');
const MongoClient = require('mongodb').MongoClient;
app.use(bodyParser.urlencoded({extended : true}));
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
require('dotenv').config()
const { ObjectId } = require('mongodb');

var db;
MongoClient.connect(process.env.DB_URL, function(에러, client){
    if (에러) return console.log(에러);
    //서버띄우는 코드 여기로 옮기기
    db = client.db('todoapp');

    // db.collection('post').insertOne({이름 : 'John', _id : 100}, function(에러, 결과){
    //     console.log('저장완료');
    // });

    app.listen(process.env.PORT, function() {
        console.log('listening on 9380');
    });
  })


app.get('/pet',function(요청, 응답){
    응답.send('펫쇼핑입니다. 반갑습니다.');
});

app.get('/beauty',function(요청, 응답){
    응답.send('뷰티쇼핑입니다. 하이요.');
});

app.get('/',function(요청, 응답){
    //응답.sendFile(__dirname + '/index.html');
    응답.render('index.ejs');
});

app.get('/write',function(요청, 응답){
    응답.render('write.ejs');
    //응답.sendFile(__dirname + '/write.html');
});







// detail로 접속시 detail.ejs 보여줌
app.get('/detail/:id', function(요청, 응답){
    db.collection('post').findOne({_id : parseInt(요청.params.id)}, function(에러, 결과){
        console.log(결과);
        응답.render('detail.ejs', { data : 결과 });
    });
    
});

app.get('/edit/:id', function(요청, 응답){
    db.collection('post').findOne({_id : parseInt(요청.params.id)}, function(에러, 결과){
        console.log(결과);
        응답.render('edit.ejs', { data : 결과 });
    });
});

app.put('/edit', function(요청, 응답){
    db.collection('post').updateOne({_id : parseInt(요청.body.id)}, { $set : { 제목 : 요청.body.title, 날짜 : 요청.body.date } }, function(에러, 결과){
        console.log('수정완료');
        응답.redirect('/list');
    });
});

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const { application } = require('express');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(요청, 응답){
    응답.render('login.ejs');
});

app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), function(요청, 응답){
    응답.redirect('/');
});

app.get('/mypage', 로그인했니, function(요청, 응답){
    console.log(요청.user);
    응답.render('mypage.ejs',{ 사용자 : 요청.user });
});

function 로그인했니(요청, 응답, next){
    if(요청.user){
        next();
    }else{
        응답.send('로그인이 되지않았음');
    }
}



passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));

  //세션을 저장시키는 코드 - 로그인성공시발동
  passport.serializeUser(function (user, done) {
    done(null, user.id)
  });

  // 어떤 사람인지 해석하는 코드
  passport.deserializeUser(function (아이디, done) {
    db.collection('login').findOne({id : 아이디}, function(에러, 결과){
        done(null, 결과);
    });
  }); 

  

  app.post('/register', function(요청, 응답){
    db.collection('login').insertOne( { id : 요청.body.id, pw : 요청.body.pw }, function(에러, 결과){
        응답.redirect('/');
    });
  });


  //어떤 사람이 /add 라는 경로로 post요청을 하면 데이터 2개(날짜, 제목)을 보내주는데
// 이 때 post라는 이름을 가진 collection에 2개의 데이터 저장하기
app.post('/add',function(요청, 응답){
    
    console.log(요청.body.date);
    console.log(요청.body.title);
    var postCount = 0;
    db.collection('counter').findOne({name : '게시물갯수'}, function(에러, 결과){
       postCount = 결과.totalPost;
    
       db.collection('post').insertOne({_id : postCount + 1, 작성자 : 요청.user._id, 제목 : 요청.body.title, 날짜 : 요청.body.date}, function(에러, 결과){
        console.log('저장완료');

            db.collection('counter').updateOne({name : '게시물갯수'}, { $inc : {totalPost:1} }, function(에러, 결과){
                if(에러){
                    응답.send('전송실패');
                    return console.log(에러);
                }
                else{
                    응답.redirect('/list');
                }
            });
        });
    });
});

app.delete('/delete', function(요청, 응답){
    console.log(요청.body);
    요청.body._id = parseInt(요청.body._id);

    var 삭제할데이터 = { _id : 요청.body._id, 작성자 : 요청.user._id }

    db.collection('post').deleteOne(삭제할데이터, function(에러, 결과){
        if(에러){
            응답.status(400).send({ message : '실패했습니다.' });
        }else{
            console.log('삭제완료');
            응답.status(200).send({ message : '성공했습니다.' });   //응답코드 200 보내기
        }
    });
});



//목록 페이지
app.get('/list', function(요청, 응답){
    //post 컬렉션에서 데이터 모두 꺼내주기
    db.collection('post').find().toArray(function(에러, 결과){
        console.log(결과);
        응답.render('list.ejs', { posts : 결과 });
    });
});

app.use('/shop', require('./routes/shop.js'));
app.use('/board/sub', require('./routes/boardsub.js'));


let multer = require('multer');
var storage = multer.diskStorage({

  destination : function(req, file, cb){
    cb(null, './public/image')
  },
  filename : function(req, file, cb){
    cb(null, file.originalname)
  }
});

var upload = multer({storage : storage});

app.get('/upload', function(요청, 응답){
    응답.render('upload.ejs');
});

app.post('/upload', upload.single('프로필'), function(요청, 응답){
    응답.send('업로드완료');
});

app.get('/image/:imageName', function(요청, 응답){
    응답.sendFile(__dirname + '/public/image/' + 요청.params.imageName);
});

app.post('/chatroom', 로그인했니, (요청, 응답) => {
    
    var 추가할데이터 = 
    {
    member : [ObjectId(요청.body.당한사람id), 요청.user._id],
    date : new Date(),
    title : 요청.body.채팅방명
    }

    db.collection('chatroom').insertOne(추가할데이터, function(에러, 결과){
        
    });
});

app.get('/search', (요청, 응답) => {
    var 검색조건 = [
        {
          $search: {
            index: 'titleSearch',
            text: {
              query: 요청.query.value,
              path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
            }
          }
        }
      ] 
    db.collection('post').aggregate(검색조건).toArray((에러, 결과)=>{
        console.log(결과);
        응답.render('list.ejs', {posts : 결과});
    })
  });

  app.get('/chat', 로그인했니, (요청, 응답) => {
    db.collection('chatroom').find({ member : 요청.user._id }).toArray(function(에러, 결과){
        console.log(결과);
        모든데이터 = {
            chatdata : 결과,
            user : 요청.user._id
        }
        응답.render('chat.ejs', { alldata : 모든데이터});
    });
  });


  app.post('/message', 로그인했니, (요청, 응답) => {
    
    var 추가할데이터 = 
    {
    parent : 요청.body.parent,
    userid : 요청.user._id,
    content : 요청.body.content,
    date : new Date()
    }

    db.collection('message').insertOne(추가할데이터, function(에러, 결과){
        
    });
});

app.get('/message/:id', 로그인했니, function(요청, 응답){

  응답.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  db.collection('message').find({ parent : 요청.params.id }).toArray()
  .then((결과) => {
    응답.write('event: test\n');
    응답.write('data: ' + JSON.stringify(결과) + '\n\n');
  });

    const pipeline = [
        { $match: { 'fullDocument.parent' : 요청.params.id } }
    ];
    
    const changeStream = db.collection('message').watch(pipeline);

    changeStream.on('change', (result) => {
        console.log('디비변동시 작동');
        응답.write('event: test\n');
        var 추가된문서 = [result.fullDocument];
        응답.write(`data: ${JSON.stringify(추가된문서)}\n\n`);
        console.log('변동사항 모두전송됨');
    });

});