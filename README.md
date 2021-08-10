## 오내요 (오늘은 내가 요리사)


<h4>1. 기획배경</h4>

• 코로나로 인해서 사람들이 집에 있는 시간이 늘어나면서 집에서 요리를 하는 사람들이 늘어남<br>
• 이제 막 요리를 시작한 사람들이 서로의 레시피를 공유하고 뽐낼수 있는 사이트를 만들어보고자 함<br>
• 관리자와 사용자를 구분하여 편리항 사이트 운영을 경험해보고 싶었음<br>


<h4>2. 기획 목표</h4>

• 관리자와 사용자의 분리된 페이지<br>
• 일반 사용자는 관리자 페이지에 접근할 수 없도록 세션을 이용<br>
• 사용자들이 다양한 게시판에 글과 이미지를 올리면서 활동<br>
• 사용자들이 글을 수정, 삭제가 가능하고 각 게시물 마다 댓글을 달 수 있도록<br>


<h4>3. 사용 언어와 프로그램</h4>

• Visual Studio Code
• node.js
• css
• html
• mysql<br>


<h4>4. DB 설계</h4>

파란색 - 기본키 / 주황색 - 외래키<br>

 
 ![db](https://user-images.githubusercontent.com/75840459/128797237-2bbf3ec3-3f29-4bec-9035-b260dab9e5b4.PNG)

• admin : 관리자<br>
• member : 사용자<br>
• menu_category : 글 카테고리<br>
• recipe : 글<br>
• comments : 댓글<br>

<h4>5. 구현 화면</h4>

1) 사용자의 회원가입과 로그인

![ezgif com-gif-maker (16)](https://user-images.githubusercontent.com/75840459/128864098-602c8930-dbf2-4c07-9b46-7c4533e2674d.gif)



