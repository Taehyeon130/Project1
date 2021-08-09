var http = require("http");
var express = require("express");
var static = require("serve-static");
var ejs = require("ejs");
var mysql = require("mysql");
var path = require("path");
var multer = require("multer");
var fs = require("fs");

var mymodule=require("./lib/mymodule.js");
var expressSessioin = require("express-session"); 

const conStr={
    url:"localhost",
    user:"root",
    password:"1234",
    database:"recipe_project"
};

var upload = multer({
    storage:multer.diskStorage({
        destination:function(request,file,cb){ 
            cb(null,__dirname+"/static/food"); //콜백함수, 
        },
        filename:function(request,file,cb){ //디렉토리에 저장할 파일의 이름을 어떻게 할것인지
            console.log("file is ",file);
            console.log(path.extname(file.originalname));//업로드된 파일의 확장자는
            cb(null,new Date().valueOf()+path.extname(file.originalname));
        }
    })
});

var app = express();

app.use(static(__dirname+"/static")); 
app.use(express.urlencoded({
    extended:true
}));

app.use(expressSessioin({
    secret:"key secret",
    resave:true,
    saveUninitialized:true
}));


app.set("view engine","ejs");

//시작 페이지
app.get("/yorin/main",function(request,response){
    response.render("mainpage/main");
});


/*---------------------------------------- 관리자 관련 처리 ---------------------------------------------*/

/*----------------------------------------------------------------------------------
    1. 관리자 로그인
-------------------------------------------------------------------------------------*/
// 관리자 로그인 폼 요청
app.get("/admin/loginform",function(request,response){
    response.render("admin/login");
});

// 관리자 로그인 요청 처리
app.post("/admin/login", function(request, response){
    var master_id=request.body.master_id;
    var master_pass=request.body.master_pass;
    console.log(master_id);
    console.log(master_pass);

    var sql="select * from admin where master_id=? and master_pass=?";

    var con=mysql.createConnection(conStr);
    con.query(sql, [master_id, master_pass] , function(err,  result , fields){
        if(err){
            console.log("조회 실패", err);
        }else{

            if(result.length <1){
                console.log("로그인 실패");
                response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                response.end(mymodule.getMsgBack("로그인 정보가 올바르지 않습니다"));
            }else{
                console.log("로그인 조회", result);
                request.session.admin={
                    admin_id:result[0].admin_id,
                    master_id:result[0].master_id,
                    master_pass:result[0].master_pass,
                    master_name:result[0].master_name
                };
                response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                response.end(mymodule.getMsgUrl("로그인성공","/admin/main"));
            }
        }
        con.end();
    });
});


// 관리자 메인 화면
app.get("/admin/main",function(request,response){
    var sql =  "select *from menu_category";
    var con = mysql.createConnection(conStr);

    if(request.session.admin==undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("관리자 권한 확인 필요","/admin/loginform"));
    }else{
        con.query(sql,function(err,result,fields){
            if(err){
                console.log("메인 페이지 로드 오류",err);
            }else{
                response.render("admin/main",{
                    param:{
                        "lib":mymodule,
                        "adminUser":request.session.admin,
                        "menuList":result     
                    }
                });
            }
             con.end();
         });
    }
});
            

// 관리자 로그아웃
app.get("/admin/logout",function(request,response){
    request.session.destroy(function(){
        request.session;
    });
    response.redirect('/yorin/main');
});

/*----------------------------------------------------------------------------------
    2. 관리자 공지
-------------------------------------------------------------------------------------*/

// 관리자 공지리스트 보여주기
app.get("/admin/notify/list",function(request,response){
    console.log(request.session);
    if(request.session.admin==undefined){ //세션에 담겨진 변수가 없다면 ...즉 로그인을 거쳐서 들어온 사용자가 아니라면 
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("관리자 권한 확인 필요","/admin/loginform"));
    }else{
        var currentPage=1;
        if(request.query.currentPage!=undefined){
            currentPage=request.query.currentPage;
        }
        var sql="select r.recipe_id, r.menu_category_id,title,writer,regdate,hit,filename, count(msg) as cnt";
        sql+=" from recipe r"; 
        sql+=" left join comments c";
        sql+=" on r.recipe_id=c.recipe_id where r.menu_category_id=4";
        sql+=" group by r.recipe_id,menu_category_id,title,writer,regdate,hit,filename";
        sql+=" order by r.recipe_id desc";
        var con = mysql.createConnection(conStr);
        con.query(sql,function(err,result,fields){
            if(err){
                console.log("공지글 목록 가져오기 실패",err);
            }else{
                sql = "select *from menu_category";
                con.query(sql,function(err2,result2,fields){
                    if(err2){
                        console.log("오류");
                    }else{
                        response.render("admin/notify/list",{
                            param:{
                                "record":result,
                                "currentPage":currentPage,
                                "lib":mymodule,
                                "adminUser":request.session.admin,
                                "menuList":result2
                            }
                        });
                    }
                    con.end();
                })
            }
        });
    }
});


// 관리자 공지 등록 폼 요청하기
app.get("/admin/notify/registform",function(request,response){
    var sql =  "select *from menu_category";
    var con = mysql.createConnection(conStr);

    if(request.session.admin==undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("로그인 필요","/admin/loginform"));
    }else{
        con.query(sql,function(err,result){
            if(err){
                console.log(err);
            }else{
                response.render("admin/notify/regist",{
                    param:{
                        "lib":mymodule,
                        "adminUser":request.session.admin,
                        "menuList":result
                    }
                });
            }
            con.end();
        });
    }
   
});


// 관리자 공지 등록하기
app.post("/admin/notify/regist",function(request,response){
    var title = request.body.title;
    var writer = request.body.writer;
    var content = request.body.content;

    console.log(title,writer,content);

    var sql = "insert into recipe(menu_category_id,title,writer,content) values(4,?,?,?)"
    var con = mysql.createConnection(conStr);
    con.query(sql,[title,writer,content],function(err,result,fields){
        if(err){
            console.log("공지사항 등록 실패",err);
        }else{
            console.log("공지사항 등록 성공");
            response.redirect("/admin/notify/list");
        }
        con.end();
    });
});

// 관리자 공지사항 자세히 보기 요청
app.get("/admin/notify/detail",function(request,response){
    if(request.session.admin==undefined){
        
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("관리자 권한 확인 필요","/admin/loginform"));
    }else{
        var recipe_id = request.query.recipe_id;
        var con = mysql.createConnection(conStr);
    
        var sql = "update recipe set hit=hit+1 where recipe_id="+recipe_id;
      
        con.query(sql,function(err2,result2,fields){
            if(err2){
                console.log("조회수 업데이트 오류",err2);
            }else{
                sql = "select *from recipe where recipe_id="+recipe_id;
                con.query(sql,function(err,result){
                    if(err){
                        console.log("상세보기",err);
                    }else{
                        sql = "select *from comments where recipe_id="+recipe_id;
                        sql+=" order by comments_id asc";
                        con.query(sql,function(error,record){
                            if(error){
                                console.log("댓글 가져오기 실패",error);
                            }else{
                                sql="select *from menu_category";
                                con.query(sql,function(err2,result3,fields){
                                    if(err2){
                                        console.log("공지사항 디테일 메뉴 오류",err2);
                                    }else{
                                        response.render("admin/notify/detail",{
                                            param:{
                                                "record":result[0], //공지 하나
                                                "commentsList":record, //코멘트 목록
                                                "lib":mymodule,
                                                "adminUser":request.session.admin,
                                                "menuList":result3
                                            }
                                        });
                                    }
                                    con.end();
                                })
                            }

                        });
    
                    }
                })
            }
        });
    }
});

// 관리자 공지사항 수정 폼 요청
app.get("/admin/notify/editform",function(request,response){
    if(request.session.admin == undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("관리자 권한 확인 필요","/admin/loginform"));
    }else{
        var recipe_id = request.query.recipe_id;
        var sql = "select *from recipe where recipe_id="+recipe_id;
        var con = mysql.createConnection(conStr);
        con.query(sql,function(err,result){
            if(err){
                console.log("수정 폼 요류",err);
            }else{
                sql = "select *from menu_category";
                con.query(sql,function(error,result2){
                    if(error){
                        console.log("메뉴 오류",error);
                    }else{
                        response.render("admin/notify/edit",{
                            param:{
                                "record":result[0],
                                "adminUser":request.session.admin,
                                "menuList":result2,
                             }
                        });
                    }
                    con.end();
                })
            }
        })
    }
});

// 관리자 공지사항 수정 요청
app.post("/admin/notify/edit",function(request,response){
    if(request.session.admin==undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("관리자 권한 확인 필요","/admin/loginform"));
    }else{
        var title = request.body.title;
        var content = request.body.content;
        var recipe_id = request.body.recipe_id;

        var writer = request.session.admin.master_name;

        var sql =  "select writer from recipe where recipe_id="+recipe_id;
        var con = mysql.createConnection(conStr);

        con.query(sql,function(error,result){
            if(error){
                console.log(error);
            }else{
                var wr = result[0].writer;

                if((writer==wr)==false){
                    response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                    response.end(mymodule.getMsgUrl("작성자가 아니면 수정할 수 없습니다","/admin/notify/list"));
                }else{
                    sql = "update recipe set title=?, content=? where recipe_id=? and writer=?";
            
                    con.query(sql,[title,content,recipe_id,writer],function(err,result,fields){
                        if(err){
                            console.log("공지사항 수정 오류",err);
                        }else{
                            if(result.affectedRows==0){
                                response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                                response.end(mymodule.getMsgUrl("작성자가 아니면 삭제할 수없습니다.","/admin/notify/list"));
                            }else{
                                response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                                // response.end(mymodule.getMsgUrl("수정완료","/admin/notify/detail?recipe_id=",recipe_id));
                                response.end(mymodule.getMsgUrl("수정완료","/admin/notify/detail?recipe_id="+recipe_id));
                            }
                        }
                        con.end();
                    });
                }
            }
        })

    }
});

// 관리자 공지사항 삭제 요청
app.post("/admin/notify/del",function(request,response){
    if(request.session.admin ==undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("관리자 권한 확인 필요","/admin/loginform"));
    }else{
        var recipe_id = request.body.recipe_id;
        var writer = request.session.admin.master_name;
        
        var sql = "select writer from recipe where recipe_id="+recipe_id;
        var con = mysql.createConnection(conStr);
        con.query(sql,function(error,result){
            if(error){
                console.log(error);
            }else{
                console.log(result);
                var wr = result[0].writer;
                console.log(writer);
                console.log(wr);

                console.log(writer==wr);
                if((writer==wr)==false){  //같지 않으면  true같으면 false의 결과가 나옴
                    response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                    response.end(mymodule.getMsgUrl("작성자가 아니면 삭제할 수 없습니다","/admin/notify/list"));
                }else{ 
                    sql = "delete from comments where recipe_id=?";
                    con.query(sql,[recipe_id],function(error2,result2){
                        console.log(sql);
                        console.log("댓글 삭제",result2);
                        if(error2){
                            console.log("댓글 삭제 오류");
                        }else{
                            sql ="delete from recipe where recipe_id=?";
                            sql+=" and writer=?";
                            con.query(sql,[recipe_id,writer],function(error3,result3,fields){
                                console.log(sql);
                                console.log("글 삭제",result3);
                                if(error3){
                                    console.log(error3);
                                }else{
                                    response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                                    response.end(mymodule.getMsgUrl("삭제완료","/admin/notify/list"));
                                }
                                con.end();
                            });
                        }
                    });
                }
            }
        });
    }
});


// 코멘트 등록 요청 처리
app.post("/admin/notify/comments/regist",function(request,response){
    var recipe_id = request.body.recipe_id;
    var comments_id = request.body.comments_id;
    var msg = request.body.msg;
    var author = request.session.admin.master_name;

    var sql = "insert into comments(comments_id, recipe_id, msg,author) values(?,?,?,?)";
    var con = mysql.createConnection(conStr);
    con.query(sql,[comments_id,recipe_id,msg,author],function(err,result){
        if(err){
            console.log("댓글 등록 실패",err);
            var str="";
            str+="{";
            str+="\"result\":0";
            str+="}";
            response.end(str); //end() 메서드는 문자열을 인수로 받는다!!!
        }else{
            response.writeHead(200, {"Content-Type":"text/json;charset=utf-8"});
            var str="";
            str+="{";
            str+="\"result\":1";
            str+="}";
            response.end(str); //end() 메서드는 문자열을 인수로 받는다!!!
        }
        con.end();
    });
});

// 코멘트 목록 가져오기
app.get("/admin/notify/comments/list",function(request,response){
    var recipe_id = request.query.recipe_id;
    var sql = "select *from comments where recipe_id="+recipe_id;
    sql+=" order by comments_id desc";

    var con = mysql.createConnection(conStr);
    con.query(sql,function(err,result){
        if(err){
            console.log("댓글 목록 가져오기 실패",err);
        } else{
            console.log("댓글 결과",result);
            response.writeHead(200, {"Content-Type":"text/json;charset=utf-8"});
            //코멘트 목록을 문자열화 시켜 보내자!!
         
            response.end(JSON.stringify(result)); 
        }
        con.end();
    });
});


/*----------------------------------------------------------------------------------
    3. 관리자 회원관리
-------------------------------------------------------------------------------------*/

// 관리자 회원 목록 요청
app.get("/admin/member/list",function(request,response){
    if(request.session.admin==undefined){ 
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("관리자 권한 확인 필요","/admin/loginform"));
    }else{
        var currentPage=1;
        if(request.query.currentPage!=undefined){
            currentPage=request.query.currentPage;
        }
        
        var sql="select user_id, user_name,user_nickname,user_join from member";

        var con = mysql.createConnection(conStr);
        con.query(sql,function(err,result,fields){
            if(err){
                console.log("회원 목록 가져오기 실패",err);
            }else{
                sql = "select *from menu_category";
                con.query(sql,function(err2,result2){
                    if(err2){
                        console.log("관리자 회원 네비 오류",err2);
                    }else{
                        response.render("admin/member/list",{
                            param:{
                                "record":result,
                                "currentPage":currentPage,
                                "lib":mymodule,
                                "adminUser":request.session.admin,
                                "menuList":result2
                            }
                        });
                    }            
                    con.end();
                });
            }
        });
    }
});

/*----------------------------------------------------------------------------------
    4. 관리자 게시판관리
-------------------------------------------------------------------------------------*/

//오늘 나의 도전 리스트 요청

app.get("/admin/recipe/1",function(request,response){
    showList(1,"admin/challenge/list",request,response);
});

// 오늘 나의 도전 상세보기
app.get("/admin/challenge/detail",function(request,response){
   showDetail("admin/challenge/detail",response,request);
});



// 오늘 나의 도전 삭제 
app.post("/admin/challenge/del",upload.single("pic"),function(request,response){
    var recipe_id= request.body.recipe_id;
    var filename = request.body.filename;
    console.log(request.body);
    fs.unlink(__dirname+"/static/food/"+filename,function(err){
        if(err){
            console.log(err);
        }else{
            console.log("삭제완료");
             //db도 지우자!!
             var sql ="delete from recipe where recipe_id="+recipe_id;
             var con = mysql.createConnection(conStr);
             con.query(sql,function(error,fields){
                 if(error){
                     console.log(error);
                 }else{
                     // 목록 요청
                     response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                     response.end(mymodule.getMsgUrl("삭제완료","/admin/recipe/1"));
                 }
                 con.end();
             });
        }
     });

})


// 추천레시피 리스트 요청
app.get("/admin/recipe/2",function(request,response){
    showList(2,"admin/recom/list",request,response);
});

//추천 레시피 상세보기
app.get("/admin/recom/detail",function(request,response){
    showDetail("admin/recom/detail",response,request);
});

//자유게시판리스트 요청
app.get("/admin/recipe/3",function(request,response){
    showList(3,"admin/freeboard/list",request,response);
});

// 자유게시판 상세보기
app.get("/admin/freeboard/detail",function(request,response){
    showDetail("admin/freeboard/detail",response,request);
 });

//문의사항 요청
app.get("/admin/recipe/5",function(request,response){
    showList(5,"admin/qna/list",request,response);
});

// 문의사항 상세보기
app.get("/admin/qna/detail",function(request,response){
    showDetail("admin/qna/detail",response,request);
 });




/*---------------------------------------- 사용자 ---------------------------------------------*/

/*----------------------------------------------------------------------------------
    1. 사용자 로그인 & 회원가입
-------------------------------------------------------------------------------------*/

// 사용자 회원가입 폼
app.get("/member/registform",function(request,response){
    response.render("member/regist_form");
});

// 사용자 회원가입 요청 처리
app.post("/member/regist",function(request,response){
    
    var user_id = request.body.user_id;
    var user_pass = request.body.user_pass;
    var user_name = request.body.user_name;
    var user_nickname = request.body.user_nickname;

    console.log(user_id,user_pass,user_name,user_nickname);

    var sql = "insert into member(user_id,user_pass,user_name,user_nickname)";
    sql+=" values(?,?,?,?)";

    console.log(sql);

    var con = mysql.createConnection(conStr);
    con.query(sql,[user_id,user_pass,user_name,user_nickname],function(err,result,fields){
        if(err){
            console.log("회원등록 중 에러",err);
        }else{
            response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
            response.end(mymodule.getMsgUrl("회원가입 성공","/member/loginform"));
        }
        con.end();
    });
});


// 사용자 로그인 폼 요청 처리
app.get("/member/loginform",function(request,response){
    response.render("member/login");
});


// 사용자 로그인 요청 처리
app.post("/member/login",function(request,response){
    var user_id = request.body.user_id;
    var user_pass = request.body.user_pass;

    var sql = "select *from member where user_id=? and user_pass=?";
    var con = mysql.createConnection(conStr);
    con.query(sql,[user_id,user_pass],function(err,result,fields){
        console.log("sql",sql);
        if(err){
            console.log("조회 실패", err);
        }else{
            if(result.length <1){
                console.log("로그인 실패");
                response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                response.end(mymodule.getMsgBack("로그인 정보가 올바르지 않습니다"));
            }else{
                request.session.member={
                    member_id:result[0].member_id,
                    user_id:result[0].user_id,
                    user_pass:result[0].user_pass,
                    user_name:result[0].user_name,
                    user_nickname:result[0].user_nickname
                };
                console.log("로그인 조회", result);
                response.redirect("/recipe/main");
            }
            con.end();
        }
    });

});


// 사용자 로그아웃
app.get("/member/logout",function(request,response){
    request.session.destroy(function(){
        request.session;
    });
    response.redirect('/yorin/main');
});


/*------------------------------------ 홈페이지 --------------------------------------*/

/*----------------------------------------------------------------------------------
    1. 홈페이지 메인
-------------------------------------------------------------------------------------*/

// 홈페이지 메인 화면 요청
app.get("/recipe/main",function(request,response){
    var sql =  "select *from menu_category";
    var con = mysql.createConnection(conStr);

    if(request.session.member==undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("로그인 필요","/member/loginform"));
    }else{
        con.query(sql,function(err,result,fields){
            if(err){
                console.log("메인 페이지 로드 오류",err);
            }else{
                sql = "select *from recipe where menu_category_id=1"; //도전
                con.query(sql,function(err2,result2){
                    if(err2){
                        console.log(err2);
                    }else{
                        sql = "select *from recipe where menu_category_id=2"; //레시피
                        con.query(sql,function(err3,result3){
                            if(err3){
                                console.log(err3);
                            }else{
                                sql ="select *from recipe where menu_category_id=3";//포토
                                con.query(sql,function(err4,result4){
                                    if(err4){
                                        console.log(err4);
                                    }else{
                                        response.render("recipe/main",{
                                            param:{
                                                "lib":mymodule,
                                                "memberUser":request.session.member,
                                                "menuList":result,
                                                "chall":result2,
                                                "reci":result3,
                                                "photo":result4
                                            }
                                        });

                                    }
                                    con.end();
                                })
                            }
                            
                        })
                    }
                })
            }
        });
    }
});

/*----------------------------------------------------------------------------------
    2. 오늘 나의 도전
-------------------------------------------------------------------------------------*/

// 오늘 나의 도전 리스트 보여주기
app.get("/recipe/1",function(request,response){
    showList2(1,"recipe/challenge/list",request,response);
});

//오늘 나의 도전 등록 폼 요청하기
app.get("/recipe/challenge/registform",function(request,response){
    Mregistform("recipe/challenge/regist",response,request);
    
});


// 오늘 나의 도전 등록하기
app.post("/recipe/challenge/regist",upload.single("pic"),function(request,response){
    Mregist(1,"/recipe/1",response,request);
});


// 오늘 나의 도전 상세보기
app.get("/recipe/challenge/detail",function(request,response){
    Mdetail("recipe/challenge/detail",request,response)
});

//나의 도전 수정 폼 요청
app.get("/recipe/challenge/editform",function(request,response){
    Meditform("recipe/challenge/edit",response,request)
});


// 나의 도전수정 요청
app.post("/recipe/challenge/edit",upload.single("pic"),function(request,response){
    var recipe_id = request.body.recipe_id;
    console.log(request.file);
    Medit("/recipe/challenge/detail?recipe_id="+recipe_id,request,response);
});


// 오늘 나의 도전 삭제하기
app.post("/recipe/challenge/del",upload.single("pic"),function(request,response){
    Mdel("/recipe/1",request,response);
});

// 나의 도전 댓글 등록하기
app.post("/recipe/challenge/comments/regist",function(request,response){
    Mcomments(request,response);
});

// 나의 도전 댓글 리스트 요청
app.get("/recipe/challenge/comments/list",function(request,response){
    McommentsList(request,response);
})

/*----------------------------------------------------------------------------------
   3. 추천 레시피
-------------------------------------------------------------------------------------*/
// 추천레시피 리스트 보여주기
app.get("/recipe/2",function(request,response){
    showList2(2,"recipe/recom/list",request,response);
});

//추천레시피  등록 폼 요청하기
app.get("/recipe/recom/registform",function(request,response){
    Mregistform("recipe/recom/regist",response,request);
    
});


// 추천레시피  등록하기
app.post("/recipe/recom/regist",upload.single("pic"),function(request,response){
    Mregist(2,"/recipe/2",response,request);
});


// 추천레시피  상세보기
app.get("/recipe/recom/detail",function(request,response){
    Mdetail("recipe/recom/detail",request,response)
});

//추천레시피  수정 폼 요청
app.get("/recipe/recom/editform",function(request,response){
    Meditform("recipe/recom/edit",response,request)
});


// 추천레시피  수정 요청
app.post("/recipe/recom/edit",upload.single("pic"),function(request,response){
    var recipe_id = request.body.recipe_id;
    console.log(request.file);
    Medit("/recipe/recom/detail?recipe_id="+recipe_id,request,response);
});


// 추천레시피 삭제하기
app.post("/recipe/recom/del",upload.single("pic"),function(request,response){
    Mdel("/recipe/2",request,response);
});

// 추천레시피  댓글 등록하기
app.post("/recipe/recom/comments/regist",function(request,response){
    Mcomments(request,response);
});

// 추천레시피  댓글 리스트 요청
app.get("/recipe/recom/comments/list",function(request,response){
    McommentsList(request,response);
})


/*----------------------------------------------------------------------------------
    4. 자유게시판
-------------------------------------------------------------------------------------*/
// 자유게시판 리스트 보여주기
app.get("/recipe/3",function(request,response){
    showList2(3,"recipe/freeboard/list",request,response);
});

//자유게시판   등록 폼 요청하기
app.get("/recipe/freeboard/registform",function(request,response){
    Mregistform("recipe/freeboard/regist",response,request);
    
});

// 자유게시판   등록하기
app.post("/recipe/freeboard/regist",upload.single("pic"),function(request,response){
    Mregist(3,"/recipe/3",response,request);
});

// 자유게시판  상세보기
app.get("/recipe/freeboard/detail",function(request,response){
    Mdetail("recipe/freeboard/detail",request,response)
});

//자유게시판  수정 폼 요청
app.get("/recipe/freeboard/editform",function(request,response){
    Meditform("recipe/freeboard/edit",response,request)
});


// 자유게시판  수정 요청
app.post("/recipe/freeboard/edit",upload.single("pic"),function(request,response){
    var recipe_id = request.body.recipe_id;
    console.log(request.file);
    Medit("/recipe/freeboard/detail?recipe_id="+recipe_id,request,response);
});


//자유게시판  삭제하기
app.post("/recipe/freeboard/del",upload.single("pic"),function(request,response){
    Mdel("/recipe/3",request,response);
});

// 자유게시판   댓글 등록하기
app.post("/recipe/freeboard/comments/regist",function(request,response){
    Mcomments(request,response);
});

// 자유게시판 댓글 리스트 요청
app.get("/recipe/freeboard/comments/list",function(request,response){
    McommentsList(request,response);
})

/*----------------------------------------------------------------------------------
    5. 공지사항
-------------------------------------------------------------------------------------*/

// 공지사항 리스트 보여주기
app.get("/recipe/4",function(request,response){
    showList2(4,"recipe/notify/list",request,response);
});

// 공지사항 자세히 보기
app.get("/recipe/notify/detail",function(request,response){
    if(request.session.member==undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("로그인 필요","/member/loginform"));
    }else{
        var recipe_id = request.query.recipe_id;
        var con = mysql.createConnection(conStr);
    
        var sql = "update recipe set hit=hit+1 where recipe_id="+recipe_id;
      
        con.query(sql,function(err2,result2,fields){
            if(err2){
                console.log("조회수 업데이트 오류",err2);
            }else{
                sql = "select *from recipe where recipe_id="+recipe_id;
                con.query(sql,function(err,result){
                    if(err){
                        console.log("상세보기",err);
                    }else{
                        sql = "select *from comments where recipe_id="+recipe_id;
                        sql+=" order by comments_id asc";
                        con.query(sql,function(error,record){
                            if(error){
                                console.log("댓글 가져오기 실패",error);
                            }else{
                                sql="select *from menu_category";
                                con.query(sql,function(err2,result3,fields){
                                    if(err2){
                                        console.log("공지사항 디테일 메뉴 오류",err2);
                                    }else{
                                        response.render("recipe/notify/detail",{
                                            param:{
                                                "record":result[0], //공지 하나
                                                "commentsList":record, //코멘트 목록
                                                "lib":mymodule,
                                                "memberUser":request.session.member,
                                                "menuList":result3
                                            }
                                        });
                                    }
                                    con.end();
                                })
                            }

                        });
    
                    }
                })
            }
        });
    }
});

// 공지사항 댓글 등록하기
app.post("/recipe/notify/comments/regist",function(request,response){
    Mcomments(request,response);
});

// 공지사항 댓글 리스트 요청
app.get("/recipe/notify/comments/list",function(request,response){
    McommentsList(request,response);
})


/*----------------------------------------------------------------------------------
    6. 문의하기
-------------------------------------------------------------------------------------*/
// 문의하기 리스트 보여주기
app.get("/recipe/5",function(request,response){
    showList2(5,"recipe/qna/list",request,response);
});

//문의하기  등록 폼 요청하기
app.get("/recipe/qna/registform",function(request,response){
    Mregistform("recipe/qna/regist",response,request);
});


// 문의하기  등록하기
app.post("/recipe/qna/regist",upload.single("pic"),function(request,response){
    Mregist(5,"/recipe/5",response,request);
});


// 문의하기 상세보기
app.get("/recipe/qna/detail",function(request,response){
    Mdetail("recipe/qna/detail",request,response)
});

//문의하기 수정 폼 요청
app.get("/recipe/qna/editform",function(request,response){
    Meditform("recipe/qna/edit",response,request)
});


// 문의하기 수정 요청
app.post("/recipe/qna/edit",upload.single("pic"),function(request,response){
    var recipe_id = request.body.recipe_id;
    console.log(request.file);
    Medit("/recipe/qna/detail?recipe_id="+recipe_id,request,response);
});


//문의하기  삭제하기
app.post("/recipe/qna/del",upload.single("pic"),function(request,response){
    Mdel("/recipe/5",request,response);
});

// 문의하기 댓글 등록하기
app.post("/recipe/qna/comments/regist",function(request,response){
    Mcomments(request,response);
});

// 문의하기댓글 리스트 요청
app.get("/recipe/qna/comments/list",function(request,response){
    McommentsList(request,response);
})


/*-------------------------------------------------- 관리자 관련 함수 ----------------------------------------------*/ 
// 관리자 네비 메뉴 리스트 보여주기
function showList(menu_category,url,request,response){
    if(request.session.admin == undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("관리자 권한 확인 필요","/admin/loginform"));
    }else{
        var currentPage=1;
        if(request.query.currentPage!=undefined){
            currentPage=request.query.currentPage;
        }
    
        var sql="select *from recipe where menu_category_id="+menu_category;
    
        var con = mysql.createConnection(conStr);
        con.query(sql,function(err,result,fields){
            if(err){
                console.log("목록 가져오기 실패",err);
            }else{
                sql = "select *from menu_category";
                con.query(sql,function(err2,result2){
                    if(err2){
                        console.log(err2);
                    }else{
                        response.render(url,{
                            param:{
                                "record":result,
                                "currentPage":currentPage,
                                "lib":mymodule,
                                "adminUser":request.session.admin,
                                "menuList":result2
                            }
                        });
                    }
                    con.end();
                })
            }
        });
    }
}


// 관리자 메뉴 디테일
function showDetail(url,response,request){
    if(request.session.admin==undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("관리자 권한 확인 필요","/admin/loginform"));
    }else{
        var recipe_id = request.query.recipe_id;
        var con = mysql.createConnection(conStr);
    
        var sql = "update recipe set hit=hit+1 where recipe_id="+recipe_id;
        con.query(sql,function(err,result){
            if(err){
                console.log(err);
            }else{
                sql = "select *from recipe where recipe_id="+recipe_id;
                con.query(sql,function(err2,result2,fields){
                    if(err2){
                        console.log(err2);
                    }else{
                        sql="select *from menu_category";
                        con.query(sql,function(err3,result3){
                            if(err3){
                                console.log(err3);
                            }else{
                                response.render(url,{
                                    param:{
                                        "record":result2[0],
                                        "lib":mymodule,
                                        "adminUser":request.session.admin,
                                        "menuList":result3
                                    }
                                });
                            }
                            con.end();
                        });
                    }
                });
            }
        });
    }
}


/*------------------------------------------------- 사용자 관련 함수 ------------------------------------------------*/

// 멤버일 때 글 리스트 보여주기
function showList2(menu_category,url,request,response){
    if(request.session.member == undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("로그인 필요","/member/loginform"));
    }else{
        var currentPage=request.query.currentPage;
        if(request.query.currentPage==undefined){
            currentPage=1;
        }
    
        var sql="select r.recipe_id, r.menu_category_id,title,writer,regdate,hit,filename, count(msg) as cnt";
        sql+=" from recipe r"; 
        sql+=" left join comments c";
        sql+=" on r.recipe_id=c.recipe_id where r.menu_category_id="+menu_category;
        sql+=" group by r.recipe_id,menu_category_id,title,writer,regdate,hit,filename";
        sql+=" order by r.recipe_id desc";
    
        var con = mysql.createConnection(conStr);
        con.query(sql,function(err,result,fields){
            if(err){
                console.log("목록 가져오기 실패",err);
            }else{
                sql = "select *from menu_category";
                con.query(sql,function(err2,result2){
                    if(err2){
                        console.log(err2);
                    }else{
                        response.render(url,{
                            param:{
                                "record":result,
                                "currentPage":currentPage,
                                "lib":mymodule,
                                "memberUser":request.session.member,
                                "menuList":result2
                            }
                        });
                    }
                    con.end();
                })
            }
        });
    }
}

// 멤버일때 등록 폼 보여주기
function Mregistform(url,response,request){
    var sql =  "select *from menu_category";
    var con = mysql.createConnection(conStr);

    if(request.session.member==undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("로그인 필요","/member/loginform"));
    }else{
        con.query(sql,function(err,result){
            if(err){
                console.log(err);
            }else{
                response.render(url,{
                    param:{
                        "lib":mymodule,
                        "memberUser":request.session.member,
                        "menuList":result
                    }
                });
            }
            con.end();
        });
    }
}


// 멤버일때 글 등록하기
function Mregist(menu_category,url,response,request){
    var title = request.body.title;
    var writer = request.body.writer;
    var content = request.body.content;
    var filename=request.file.filename; 
    console.log(request.file);

    var sql = "insert into recipe(menu_category_id,title,writer,content,filename) values("+menu_category+",?,?,?,?)"
    var con = mysql.createConnection(conStr);
    con.query(sql,[title,writer,content,filename],function(err,result,fields){
        
        if(err){
            console.log("글등록 실패",err);
        }else{
            console.log("글 등록 성공");
            response.redirect(url);   
        }
        con.end();
    });
}

// 멤버일 때 글 상세보기
function Mdetail(url,request,response){
    if(request.session.member==undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("로그인 필요","/member/loginform"));
    }else{
        var recipe_id = request.query.recipe_id;
        var con = mysql.createConnection(conStr);
        var sql="update recipe set hit=hit+1 where recipe_id="+recipe_id;
       
        con.query(sql,function(err,result,fields){
            if(err){
                console.log(err);
            }else{
                sql = "select *from recipe where recipe_id="+recipe_id;
                con.query(sql,function(error,result2){
                    if(error){
                        console.log(error);
                    }else{
                        sql = "select *from comments where recipe_id="+recipe_id;
                        sql+=" order by comments_id asc";
                        con.query(sql,function(error2,result3){
                            if(error2){
                                console.log(error2);
                            }else{
                                sql = "select *from menu_category";
                                con.query(sql,function(error3,result4){
                                    if(error3){
                                        console.log(error3);
                                    }else{
                                        response.render(url,{
                                            param:{
                                                "record":result2[0],
                                                "commentsList":result3,
                                                "lib":mymodule,
                                                "memberUser":request.session.member,
                                                "menuList":result4
                                            }
                                        });
                                    }
                                    con.end();
                                })
                            }
                        })
                    }
                })
            }
        });
    }
}

// 멤버일때 글 삭제하기
function Mdel(url,request,response){
    var recipe_id= request.body.recipe_id;
    var filename = request.body.filename;

    if(request.session.member==undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("로그인 필요","/member/loginform"));
    }else{
        var writer = request.session.member.user_nickname;
        var sql =  "select writer from recipe where recipe_id="+recipe_id;
        var con = mysql.createConnection(conStr);
        con.query(sql,function(error,result){
            if(error){
                console.log(error);
            }else{
                var wr = result[0].writer;
                if((writer==wr)==false){
                    response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                    response.end(mymodule.getMsgUrl("작성자가 아니면 삭제할 수 없습니다",url));
                }else{
                    fs.unlink(__dirname+"/static/food/"+filename,function(err){
                        if(err){
                            console.log(err);
                        }else{
                            console.log("삭제완료");
                             //db도 지우자!!
                             sql ="delete from recipe where recipe_id="+recipe_id;
                            //  sql+=" and writer="+writer;
                             con.query(sql,function(error,result){
                                 if(error){
                                     console.log(error);
                                 }else{            
                                    response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                                    response.end(mymodule.getMsgUrl("삭제완료",url));
                                }
                                con.end();
                             });
                        }
                     });
                }
            }

        });
    }
}


// 멤버일 때 글 수정 폼 요청하기
function Meditform(url,response,request){
    var sql =  "select *from menu_category";
    var con = mysql.createConnection(conStr);
    
    if(request.session.member==undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("로그인 필요","/member/loginform"));
    }else{
        var recipe_id = request.query.recipe_id;
        sql = "select *from recipe where recipe_id="+recipe_id;
        con.query(sql,function(err,result){
            if(err){
                console.log(err);
            }else{
                sql ="select *from menu_category";
                con.query(sql,function(err2,result2){
                    if(err2){
                        console.log(err2);
                    }else{
                        response.render(url,{
                            param:{
                                "record":result[0],
                                "lib":mymodule,
                                "memberUser":request.session.member,
                                "menuList":result2
                            }
                        });
                    }
                    con.end();
                });
            }
        });
    }
}


// 멤버일 때 수정하기
function Medit(url,request,response){
    if(request.session.member==undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("로그인 필요","/member/loginform"));
    }else{
        var title = request.body.title;
        var content = request.body.content;
        var filename = request.body.filename;
        var recipe_id = request.body.recipe_id;
        var writer = request.session.member.user_nickname;

        console.log(title, content,filename,recipe_id,writer);

        var sql ="select writer from recipe where recipe_id="+recipe_id;
        var con = mysql.createConnection(conStr);
        con.query(sql,function(error,result){
            if(error){
                console.log(error);
            }else{
                var wr = result[0].writer;
                if((writer==wr)==false){
                    response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                    response.end(mymodule.getMsgUrl("작성자가 아니면 수정할 수 없습니다","/recipe/1"));
                }else{
                    console.log("리퀘스트!!!!!1",request.file);
                    console.log("파일파일!!!",request.file);
                    if(request.file != undefined){
                        console.log("사진 교체");
                        fs.unlink(__dirname+"/static/food/"+filename,function(err){
                            if(err){
                                console.log(err);
                            }else{
                                filename = request.file.filename;
                                sql = "update recipe set title=?, content=?, filename=? where recipe_id=?";
                                con.query(sql,[title,content,filename,recipe_id],function(err2,fields){
                                    if(err2){
                                        console.log(err2);
                                    }else{
                                        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                                        // response.end(mymodule.getMsgUrl("수정완료","/recipe/1"));
                                        response.end(mymodule.getMsgUrl("수정완료",url));
                                    }
                                });
                            }
                        });
                    }else{
                         var sql = "update recipe set title=?, content=? where recipe_id=?";
                         var con = mysql.createConnection(conStr);
                        con.query(sql,[title,content,recipe_id],function(err3,fields){
                            if(err3){
                                console.log(err3);
                            }else{
                                response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                                // response.end(mymodule.getMsgUrl("수정완료","/recipe/1"));
                                response.end(mymodule.getMsgUrl("수정완료",url));
                            }
                            con.end();
                        })
                    }
                }
            }
        });
    }
}


// 멤버일 때 코멘트 등록 요청
function Mcomments(request,response){
    var recipe_id = request.body.recipe_id;
    var comments_id = request.body.comments_id;
    var msg = request.body.msg;
    var author = request.session.member.user_nickname;

    var sql = "insert into comments(comments_id, recipe_id, msg, author) values(?,?,?,?)";
    var con=mysql.createConnection(conStr);
    con.query(sql,[comments_id,recipe_id,msg,author],function(error,result){
        if(error){
            console.log("댓글 등록 실패",err);
            var str="";
            str+="{";
            str+="\"result\":0";
            str+="}";
            response.end(str); 
        }else{
            response.writeHead(200, {"Content-Type":"text/json;charset=utf-8"});
            var str="";
            str+="{";
            str+="\"result\":1";
            str+="}";
            response.end(str); 
        }
        con.end();
    });
}


// 멤버일 때 댓글 리스트 요청
function McommentsList(request,response){
    var recipe_id = request.query.recipe_id;
    var sql = "select *from comments where recipe_id="+recipe_id;
    sql+=" order by comments_id desc";
    var con = mysql.createConnection(conStr);
    con.query(sql,function(err,result){
        if(err){
            console.log(err,"댓글 목록 가져오기 실패");
        }else{
            response.writeHead(200, {"Content-Type":"text/json;charset=utf-8"});
            response.end(JSON.stringify(result)); 
        }
        con.end();
    });
}



var server = http.createServer(app);
server.listen(5959,function(){
    console.log("Server is running at 5959 Port...");
});