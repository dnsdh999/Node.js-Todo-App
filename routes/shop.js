var router = require('express').Router(); 


function 로그인했니(요청, 응답, next){
    if(요청.user){
        next();
    }else{
        응답.send('로그인이 되지않았음');
    }
}

//여기있는 모든 url에 적용할 미들웨어
router.use(로그인했니);

router.get('/shirts', function(요청, 응답){
    응답.send('셔츠 파는 페이지입니다.');
 });
 
 router.get('/pants', function(요청, 응답){
    응답.send('바지 파는 페이지입니다.');
 }); 

 module.exports = router;