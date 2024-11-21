var current_st = 'maria';
var answer_ngaykinh = false;
var quiz = false;
var an_ten_thanh = false;

var female_saints = [];
var male_saints = [];
var abc = ['A', 'B', 'C'];
var data = {};



$(function () {
	$.get("https://asia-southeast1-chien-non.cloudfunctions.net/get_saints", function(res_data, status){
		data = res_data;
		for (var key in data) {
			var saint = data[key];
			if (saint['sex'] == 'male') {
				male_saints.push(saint['name']);
			} else {
				female_saints.push(saint['name']);
			}
		}
		bind_saint_buttons();
		show_quiz();
		show_saint(current_st);
		//alert("Data: " + data + "\nStatus: " + status);
	  });
});

$.fn.multiline = function(text){
    this.text(text);
    this.html(this.html().replace(/\\n/g,'<br/>').replace(/\n/g,'<br/>'));
    return this;
}

function getRandomSaints() {
    var saint = data[current_st];
	var rs = [];
	var temp_male_saints = male_saints.slice();
	temp_male_saints.splice(temp_male_saints.indexOf(saint['name']), 1);
	var temp_female_saints = female_saints.slice();
	temp_female_saints.splice(temp_female_saints.indexOf(saint['name']), 1);
	for(var i=0; i<abc.length; i++){
		var random_st;
		if (saint['sex'] == 'male') {
			random_st = temp_male_saints[Math.floor(Math.random() * (temp_male_saints.length))];
			temp_male_saints.splice(temp_male_saints.indexOf(random_st), 1);
		} else {
			random_st = temp_female_saints[Math.floor(Math.random() * (temp_female_saints.length ))];
			temp_female_saints.splice(temp_female_saints.indexOf(random_st), 1);
		}
		rs.push(random_st);
	}
	return rs;
}

function getRandomABC() {
    return abc[Math.floor(Math.random() * (abc.length))];
}

// Hàm sinh ra một ngày tháng ngẫu nhiên trong khoảng từ năm start đến năm end
function getRandomDate(startYear, endYear) {
    // Tạo một mốc thời gian bắt đầu (1 tháng 1 của startYear)
    const startDate = new Date(startYear, 0, 1);

    // Tạo một mốc thời gian kết thúc (31 tháng 12 của endYear)
    const endDate = new Date(endYear, 11, 31);

    // Lấy thời gian của 2 mốc thời gian
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    // Tạo một giá trị ngẫu nhiên giữa 2 mốc thời gian
    const randomTimestamp = Math.random() * (endTimestamp - startTimestamp) + startTimestamp;

    // Chuyển đổi thời gian ngẫu nhiên thành đối tượng Date và trả về
    return new Date(randomTimestamp);
}

function bind_saint_buttons() {
    for (var key in data) {
        var st_bt = $('<button>');
        st_bt.attr('onclick', 'show_saint(\'' + key + '\')');
        st_bt.html(data[key]['name']);
        $('.saint_buttons').append(st_bt);
    }
}

function bind_saint_photo() {
    var st = current_st;
    var img_src = data[st]['img'];
    $('div.img').empty();
    var imgElement = $('<img>');
    imgElement.attr('class', '' + st + ' saint');
    imgElement.attr('src', img_src);
    $('div.img').append(imgElement);
}

function bind_saint_description() {
    var st = current_st;
    var desciption = data[st]['description'];
    $('div.description').empty();
    var descElement = $('<div>');
    descElement.attr('class', '' + st + ' saint');
    //descElement.multiline(desciption);
	descElement.html(desciption);
    $('div.description').append(descElement);
}

function bind_saint_quiz() {
    var st = current_st;
    var feast_day = data[st]['feast_day'];
    var name = data[st]['name'];
    $('.quiz .questions').empty();
    var question_abc_right_ans = getRandomABC();
    var questionElement = $('<div>');
    questionElement.attr('class', '' + st + ' question');
	var randomSaints = getRandomSaints();
    for (var i in abc) {
		var letter = abc[i];
        var right_answer = null;
        if (question_abc_right_ans == letter) {
            right_answer = name;
        }
        questionElement.append(build_question_name(right_answer, i, randomSaints));
    }
    var ngaykinh_abc_right_ans = getRandomABC();
    var ngaykinhElement = $('<div>');
    ngaykinhElement.attr('class', '' + st + ' ngaykinhs');
    for (var i in abc) {
		var letter = abc[i];
        var right_answer = null;
        if (ngaykinh_abc_right_ans == letter) {
            right_answer = feast_day;
        }
        ngaykinhElement.append(build_question_ngaykinh(right_answer, letter));
    }
	$('.quiz .questions').append(questionElement);
    $('.quiz .questions').append(ngaykinhElement);
}

function build_question_ngaykinh(right_answer, letter) {
    var randomDate = getRandomDate(2022, 2023);
    var ans = letter + '. ';
    var ngay_kinh_class = 'ngaykinh';
    if (right_answer != null) {
        ans += right_answer;
        ngay_kinh_class += ' right_answer';
    } else {
        ans += '' + randomDate.getDate() + '/' + (randomDate.getMonth() + 1) + '';
    }
    var answerEle = $('<div>');
    answerEle.attr('class', ngay_kinh_class);
    answerEle.html(ans);
    return answerEle;
}

function build_question_name(right_answer, index_abc, randomSaints) {
	var letter = abc[index_abc];
    var ans = letter + '. ';
    var answer_class = 'answer';
	var onclick_fn = '()';
    if (right_answer != null) {
        ans += right_answer;
        answer_class += ' right_answer';
		onclick_fn = 'show_ngaykinh()';
    } else {
        ans += randomSaints[index_abc];
    }
    var answerEle = $('<div>');
    answerEle.attr('class', answer_class);
	answerEle.attr('onclick', onclick_fn);
    answerEle.html(ans);
    return answerEle;
}

function show_quiz() {
    if (quiz) {
        $('.cmd').show();
        $('.description').hide();
        $('.quiz').show();
        $('.description').hide();

    } else {
        $('.cmd').hide();
        $('.description').show();
        $('.quiz').hide();
        $('.description').show();
    }
    quiz = !quiz;
}

function count_down() {
    var second = $('#second').val();
    var timeleft = $('#second').val();
    $('#progressBar').attr('max', second);
    //var timeleft = 10;
    let ding = new Audio('../ding.mp3');
    let tick = new Audio('../tick.mp3');
    var downloadTimer = setInterval(function () {
        if (timeleft <= 0) {
            clearInterval(downloadTimer);
            ding.play();
            $('.diamond').show();
        } else {
            tick.currentTime = 0;
            tick.play();
        }
        document.getElementById("progressBar").value = second - timeleft;
        document.getElementById("countdown").innerHTML = timeleft;
        timeleft -= 1;

    }, 1000);
}

function show_saint(st) {
    current_st = st;
    answer_ngaykinh = false;
    if (data.hasOwnProperty(st)) {
        bind_saint_photo();
        bind_saint_description();
        bind_saint_quiz();
		
		$('.question').removeClass('has_answer');
		$('.question').removeClass('current');
		$('.ngaykinhs').removeClass('current');
		$('.ngaykinhs').removeClass('has_answer');
		//$('.questions .question.'+current_st+'').removeClass('has_answer');
		$('.question.' + current_st + '').addClass('current');
		$('.' + current_st + ' .answer').show();

		$('.diamond').hide();
		$('.' + current_st + ' .right_answer').removeClass('right');
    }
}

function show_answer() {
    if (answer_ngaykinh) {
        answer_ngaykinh = false;
        $('.' + current_st + ' .ngaykinh').hide();
        $('.questions .ngaykinhs.' + current_st + '').removeClass('current');
        $('.questions .ngaykinhs.' + current_st + '').addClass('has_answer');
        $('.ngaykinhs.' + current_st + ' .right_answer').show()
        $('.ngaykinhs.' + current_st + ' .right_answer').addClass('right');
    } else {
        $('.' + current_st + ' .answer').hide();
        $('.questions .question.' + current_st + '').removeClass('current');
        $('.questions .question.' + current_st + '').addClass('has_answer');
        $('.' + current_st + ' .right_answer').show()
        $('.' + current_st + ' .right_answer').addClass('right');
    }

}

function change_button_color() {
    an_ten_thanh = !an_ten_thanh;
    if (an_ten_thanh) {
        $('.saint_buttons button').css('color', 'white');
    } else {
        $('.saint_buttons button').css('color', 'black');
    }

}

function show_ngaykinh() {
    $('.ngaykinhs.' + current_st + '').addClass('current');
    $('.ngaykinhs.' + current_st + ' .right_answer').removeClass('right');
    $('.' + current_st + ' .ngaykinh').show();
    answer_ngaykinh = true;
}
