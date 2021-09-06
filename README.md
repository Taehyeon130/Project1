## 오내요 (오늘은 내가 요리사)


<h3>1. 기획배경</h3>

• 코로나로 인해서 사람들이 집에 있는 시간이 늘어나면서 집에서 요리를 하는 사람들이 늘어남<br>
• 이제 막 요리를 시작한 사람들이 서로의 레시피를 공유하고 뽐낼수 있는 사이트를 만들어보고자 함<br>
• 관리자와 사용자를 구분하여 편리항 사이트 운영을 경험해보고 싶었음<br>


<h3>2. 기획 목표</h3>

• 관리자와 사용자의 분리된 페이지<br>
• 일반 사용자는 관리자 페이지에 접근할 수 없도록 세션을 이용<br>
• 사용자들이 다양한 게시판에 글과 이미지를 올리면서 활동<br>
• 사용자들이 글을 수정, 삭제가 가능하고 각 게시물 마다 댓글을 달 수 있도록<br>


<h3>3. 사용 언어와 프로그램</h3>

• Visual Studio Code
• node.js
• css
• html
• mysql<br>


<h3>4. DB 설계</h3>

파란색 - 기본키 / 주황색 - 외래키<br>

 
 ![db](https://user-images.githubusercontent.com/75840459/128797237-2bbf3ec3-3f29-4bec-9035-b260dab9e5b4.PNG)

• admin : 관리자<br>
• member : 사용자<br>
• menu_category : 글 카테고리<br>
• recipe : 글<br>
• comments : 댓글<br>

<h3>5. 구현 화면</h3>

<h5>사용자 모드</h5>

1) 사용자의 회원가입과 로그인

![ezgif com-gif-maker (16)](https://user-images.githubusercontent.com/75840459/128864098-602c8930-dbf2-4c07-9b46-7c4533e2674d.gif)

ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ

2) 글 등록

![ezgif com-gif-maker (19)](https://user-images.githubusercontent.com/75840459/129126382-981abfa0-7f8f-405f-a3f7-460b1ceb1a24.gif)

ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ

3) 글 수정 삭제 - 글 작성자가 아니면 수정과 삭제는 할 수 없음

![ezgif com-gif-maker (18)](https://user-images.githubusercontent.com/75840459/129126242-3b0cadc9-50ce-4b5d-a1ed-342a7cb6a5fd.gif)

ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ

4) 댓글

![ezgif com-gif-maker (20)](https://user-images.githubusercontent.com/75840459/129127428-c7dc42ed-ac70-4242-b88c-de06caa54037.gif)

ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ


<h5>관리자 모드</h5>


1) 관리자모드에 사용자가 접근

![ezgif com-gif-maker (21)](https://user-images.githubusercontent.com/75840459/129130169-98fd036b-d2fa-49d1-be55-e512fe77aeda.gif)

ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ

2) 관리자모드

![ezgif com-gif-maker (22)](https://user-images.githubusercontent.com/75840459/129130971-1616b21b-ef29-4e8d-b99f-369be2939038.gif)
