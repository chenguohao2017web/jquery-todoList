;
(function () {
    'use strict'; //严格模式

    // store.set('user','aaa');
    // store.get('user');
    // store.remove('user');

    let $form_add_task = $('.add-task');
    let $task_delete;
    let $task_detail;
    let task_list = [];
    let $task_detail_wrapper = $('.task-detail');
    let $task_detail_mask = $('.task-detail-mask');
    let current_index;
    let $updata_form;
    let $task_detail_content;
    let $updata_input;
    let $checkbox_complete;
    let $msg = $('.msg');
    let $msg_content = $msg.find('.msg-content');
    let $msg_confirm = $msg.find('.anchor');
    let $body = $('body');


    init();

    $form_add_task.on('submit', on_add_task_form_submit)
    $task_detail_mask.on('click', hide_task_detail)

    function pop(arg) {
        let conf = {};

        if (!arg) {
            console.error("can't finded arg")
        }

        if (typeof arg == 'string') {
            conf.title = arg;
        } else {
            conf = $.extend(conf, arg);
        }

        let $box;
        let $mask;
        let $confirm;
        let $cancel;
        let $title;
        let dfd;
        let confirmed;
        let timer;

        dfd = $.Deferred();

        $box = $(`<div>
            <div class="pop-title">${conf.title}</div>
            <div class="pop-content" style="margin-top:15px">
                <button class="sure">sure</button>
                <button class="cancel">cancel</button>
            <div>
            </div>`).css({
            width: '400',
            background: '#fff',
            position: 'fixed',
            padding: '15px 8px',
            color: '#444',
            textAlign: 'center',
            transform: 'translateX(-50%)',
            left: '50%',
            top: '200px',
            boxShadow: '0 1px 2px rgba(0,0,0,.5)'
        })
        $mask = $(`<div></div>`).css({
            position: 'fixed',
            top: '0',
            bottom: '0',
            width: '100%',
            background: 'rgba(0,0,0,.7)'
        })
        $title = $box.find('.pop-title').css({
            padding: '10px',
            fontSize: '20px'
        })
        $confirm = $box.find('.sure').css('marginRight', '15px')
        $cancel = $box.find('.cancel').css('background', '#ffc3c3')

        timer = setInterval(function () {
            if (confirmed != undefined) {
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismiss_pop();
            }
        }, 50);

        function dismiss_pop() {
            $mask.remove();
            $box.remove();
        }

        $confirm.on('click', function () {
            confirmed = true;
        })

        $cancel.on('click', function () {
            confirmed = false;
        })

        $mask.on('click', function () {
            confirmed = false;
        })

        $body.append($mask);
        $body.append($box);

        return dfd.promise();
    }

    function listen_msg_event() {
        $msg_confirm.on('click', function () {
            hide_msg();
        })
    }

    function on_add_task_form_submit(e) {
        e.preventDefault();
        let new_task = {};
        let $input = $(this).find('input[name=content]');
        new_task.content = $input.val();

        if (!new_task.content) {
            return;
        }

        if (add_task(new_task)) {
            $input.val(null);
        };
    }

    function listen_task_delete() {
        $task_delete.on('click', function () {
            let $this = $(this);
            let $item = $this.parent().parent();
            let index = $item.data('index')
            pop("确定删除吗？").then(res => {
                res ? delete_task(index) : null
            })
        })
    }

    function listen_task_detail() {
        let index;
        $('.task-item').on('dblclick', function () {
            index = $(this).data('index');
            show_task_detail(index);
        })
        $task_detail.on('click', function () {
            let $this = $(this);
            let $item = $this.parent().parent();
            let index = $item.data('index');
            show_task_detail(index)
        })
    }

    function listen_checkbox_complete() {
        $checkbox_complete.on('click', function () {
            let $this = $(this);
            let index = $this.parent().parent().data('index');
            let item = get(index);
            if (item.complete) {
                updata_task(index, {
                    complete: false
                });
            } else {
                updata_task(index, {
                    complete: true
                });
            }
        })
    }

    function get(index) {
        return store.get('task_list')[index];
    }

    function show_task_detail(index) {
        current_index = index;
        render_task_detail(index);
        $task_detail_wrapper.show();
        $task_detail_mask.show();
    }

    function render_task_detail(index) {
        if (index === undefined || !task_list[index]) {
            return;
        }
        let item = task_list[index];
        if (item.desc === undefined) {
            item.desc = '';
        }
        let task_detail_tpl = `<form>
                                    <div class="content">${item.content}</div>
                                    <div style="display:none" class="updataInput"><input type="text" name="content" value="${item.content}"></div>
                                    <div>
                                        <div class="desc">
                                            <textarea name="desc">${item.desc}</textarea>
                                        </div>
                                    </div>
                                    <div class="remind">
                                        <label>提醒时间</label>
                                        <input class="datetime" name="remind_date" type="text" value="${item.remind_date || ""}">
                                    </div>
                                    <div><button class="updata-btn" type="submit">updata</div>
                                </form>`;

        $task_detail_wrapper.html(null);
        $task_detail_wrapper.html(task_detail_tpl);
        $('.datetime').datetimepicker();


        $updata_form = $task_detail_wrapper.find('form');
        $task_detail_content = $updata_form.find('.content')
        $updata_input = $updata_form.find('.updataInput');

        $task_detail_content.on('dblclick', function () {
            $task_detail_content.hide();
            $updata_input.show();

        })

        $updata_form.on('submit', function (e) {
            e.preventDefault();
            let data = {};
            data.content = $(this).find('[name=content]').val();
            data.desc = $(this).find('[name=desc]').val();
            data.remind_date = $(this).find('[name=remind_date]').val();

            updata_task(index, data);
            hide_task_detail();
        })
    }

    function updata_task(index, data) {
        if (!index || !task_list[index]) {
            return;
        }
        task_list[index] = $.extend({}, task_list[index], data);
        refresh_task_list();
    }

    function hide_task_detail() {
        $task_detail_wrapper.hide();
        $task_detail_mask.hide();
    }

    function add_task(new_task) {
        task_list.push(new_task);
        refresh_task_list();
        return true;
    }

    function init() {
        task_list = store.get('task_list') || [];
        if (task_list.length > 0) {
            render_task_list();
            listen_task_detail();
            listen_msg_event();
            task_remind_check();
        }
    }

    function task_remind_check() {
        let current_timestamp;
        let itl = setInterval(function () {
            for (let i = 0; i < task_list.length; i++) {
                let item = get(i);
                let task_timestamp;
                if (!item || !item.remind_date || item.informed) {
                    continue;
                } else {
                    current_timestamp = new Date().getTime();
                    task_timestamp = new Date(item.remind_date).getTime();
                    if (current_timestamp - task_timestamp >= 1) {
                        updata_task(i, {
                            informed: true
                        });
                        show_msg(item.content);
                    }
                }
            }
        }, 500)
    }

    function show_msg(msg) {
        if (!msg) {
            return;
        }
        $msg_content.html(msg);
        $msg.show();
    }

    function hide_msg() {
        $msg.hide();
    }

    function render_task_list() {
        let $task_list = $('.task-list');
        $task_list.html('');
        let complete_items = [];
        for (let i = 0; i < task_list.length; i++) {
            let item = task_list[i];
            if (item && item.complete) {
                complete_items[i] = item;
            } else {
                let $task = render_task_item(item, i);
                $task_list.prepend($task);
            }

        }
        for (let j = 0; j < complete_items.length; j++) {
            let item = complete_items[j];
            let $task = render_task_item(item, j);
            if (!$task) continue;
            $task.addClass("completed");
            $task_list.append($task);
        }

        $task_delete = $('.action.delete');
        $task_detail = $('.action.detail');
        $checkbox_complete = $('.task-list .complete');
        listen_task_delete();
        listen_task_detail();
        listen_checkbox_complete();
    }

    function render_task_item(data, index) {
        if (!data || !index) {
            return;
        }
        let list_item_tpl = `<div class="task-item" data-index="${index}">
                                <span>
                                    <input type="checkbox" ${data.complete ? "checked" : ""} class="complete">
                                </span>
                                <span class="task-content">${data.content}</span>
                                <span class="fr">
                                    <span class="action delete">delete</span>
                                    <span class="action detail">detail</span>
                                </span>
                            </div>`;

        return $(list_item_tpl);
    }

    function delete_task(index) {
        if (index == undefined || !task_list[index]) {
            return;
        }

        delete task_list[index];

        refresh_task_list();
    }

    function refresh_task_list() {
        store.set('task_list', task_list);
        render_task_list();
    }

})();