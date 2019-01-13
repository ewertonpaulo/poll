$(function(){
    loader();

    function loader(){
        setTimeout(() => {
                $('#vote').removeClass('none');
                $('.spinner').remove();
                linkListeners();
                getInitialCount();
            }, 1500)
    }

    var $voteSection = $('#vote');
    var $tutorialSection = $('#tutorial');
    var $voteCount = $('.vote-count');
    var totalCount, negativeCount, neutralCount, negativeCount;

    function linkListeners(){
        $('.buttons-container input.button').on('click', inputHandler);
        $('.help-button').on('click', showTutorial);
        $('.vote-button').on('click', showVote);
    }

    function inputHandler(){
        var $fisrtCard = $('.card:nth-child(1)');
        var $secondCard = $('.card:nth-child(2)');

        var id = $fisrtCard.children('input[name="sentenceId"]').val();
        var index = $fisrtCard.children('input[name="sentenceIndex"]').val();
        var token = $('meta[name="csrf-token"]').attr('content');
        var note = $(this).val().toString();

        switchCards($fisrtCard, $secondCard);
        submitVote(note, id, index, token);    
    }

    function switchCards($fisrtCard, $secondCard){
        $fisrtCard
            .removeClass('active')
            .addClass('left-inactive')
            .on("transitionend MSTransitionEnd webkitTransitionEnd oTransitionEnd", removeCard);

        $secondCard
            .removeClass('right-inactive')
            .addClass('active');
    }

    function removeCard(){
        $(this).remove();
    }

    function submitVote(score, id, index, csrf){
        $.post('vote', {
            note: score,
            sentenceId: id,
            sentenceIndex: index,
            _csrf: csrf
        }, createNewCards);

        updateCount(score);
    }

    function createNewCards(rows){
        rows.forEach((data) => {
            var $newCard = $('<div></div>');

            $newCard
                .addClass('card right-inactive')
                .append($('<p></p>').text(
                    data.sentence))
                .append($('<input>').attr({
                    type: 'hidden',
                    name: 'sentenceIndex',
                    value: data.Index
                }))
                .append($('<input>').attr({
                    type: 'hidden',
                    name: 'sentenceId',
                    value: data.sentenceid
                }));
                
            $('.card-container').append($newCard);
        })  
    }

    function getInitialCount(){
        var currentCount = $voteCount.text()
                                .replace(/[^0-9\s]/g, '')
                                .split(' ')
                                .filter(Number);

        totalCount = parseInt(currentCount[0]);
        positiveCount = parseInt(currentCount[1])
        neutralCount = parseInt(currentCount[2])
        negativeCount = parseInt(currentCount[3])
    }

    function updateCount(score){
        score = parseInt(score);

        totalCount++;
        switch(score){
            case 1: positiveCount++; break;
            case 0: neutralCount++; break; 
            case -1: negativeCount++; break;
        }

        $voteCount.html(`Total: ${totalCount}<br> Positivos: ${positiveCount},
                         Neutros: ${neutralCount}, Negativos: ${negativeCount}`);
    }

    function showTutorial(){
        $tutorialSection.removeClass('none');
        $voteSection.addClass('none');  
    }

    function showVote(){
        $tutorialSection.addClass('none');
        $voteSection.removeClass('none');   
    }

});