'use strict';
const moment = require('moment');
const Controller = require('egg').Controller;
class BillController extends Controller {
  async list() {
    const { ctx, app } = this;
    const { date, page = 1, page_size = 5, type_id = 'all' } = ctx.query;
    try {

      let user_id;
      // 通过 token 解析，拿到 user_id
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      user_id = decode.id;
      const list = await ctx.service.bill.list(user_id);

      // 过滤出月份和类型所对应的账单列表
      const _list = list.filter(item => {
        console.log('data', moment(Number(item.date)).format('YYYY-MM'));
        if (type_id !== 'all') {

          return moment(Number(item.date)).format('YYYY-MM') === date && type_id == item.type_id;
        }


        return moment(Number(item.date)).format('YYYY-MM') === date;
      });

      const listMap = _list.reduce((curr, item) => {
        // curr 默认初始值是一个空数组 []
        // 把第一个账单项的时间格式化为 YYYY-MM-DD
        const date = moment(Number(item.date)).format('YYYY-MM-DD');
        // 如果能在累加的数组中找到当前项日期 date，那么在数组中的加入当前项到 bills 数组。
        if (curr && curr.length && curr.findIndex(item => item.date == date) > -1) {
          const index = curr.findIndex(item => item.date == date);
          curr[index].bills.push(item);
        }
        // 如果在累加的数组中找不到当前项日期的，那么再新建一项。
        if (curr && curr.length && curr.findIndex(item => item.date == date) == -1) {
          curr.push({
            date,
            bills: [ item ],
          });
        }
        // 如果 curr 为空数组，则默认添加第一个账单项 item ，格式化为下列模式
        if (!curr.length) {
          curr.push({
            date,
            bills: [ item ],
          });
        }
        return curr;
      }, []).sort((a, b) => moment(b.date) - moment(a.date)); // 时间顺序为倒叙，时间约新的，在越上面

      // 分页处理，listMap 为我们格式化后的全部数据，还未分页。
      const filterListMap = listMap.slice((page - 1) * page_size, page * page_size);

      // 计算当月总收入和支出
      // 首先获取当月所有账单列表
      const __list = list.filter(item => moment(Number(item.date)).format('YYYY-MM') == date);
      // 累加计算支出
      const totalExpense = __list.reduce((curr, item) => {
        if (item.pay_type == 1) {
          curr += Number(item.amount);
          return curr;
        }
        return curr;
      }, 0);
      // 累加计算收入
      const totalIncome = __list.reduce((curr, item) => {
        if (item.pay_type == 2) {
          curr += Number(item.amount);
          return curr;
        }
        return curr;
      }, 0);

      // 返回数据
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          totalExpense, // 当月支出
          totalIncome, // 当月收入
          totalPage: Math.ceil(listMap.length / page_size), // 总分页
          list: filterListMap || [], // 格式化后，并且经过分页处理的数据
        },
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '请求失败',
        data: null,
      };
    }
  }
  async add() {
    const { ctx, app } = this;
    // 获取请求中携带的参数
    const { amount, type_id, type_name, date = new Date().getTime(), pay_type, remark = '' } = ctx.request.body;
    // 判空处理
    if (!amount || !type_id || !type_name || !date || !pay_type || !remark) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
    }
    try {

      // 拿到token 获取用户信息
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.id;
      const reuslt = await ctx.service.bill.add({ user_id, amount, type_id, type_name, date, pay_type, remark });
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      };


    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '请求失败1',
        data: null,
      };

    }


  }
  async detail() {
    const { ctx, app } = this;
    const { id = '' } = ctx.query;
    let user_id;
    const token = ctx.request.header.authorization;
    // 获取当前用户信息
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return;
    user_id = decode.id;
    // 判断是否传入账单 id
    if (!id) {
      ctx.body = {
        code: 500,
        msg: '订单id不能为空',
        data: null,
      };
      return;
    }
    try {
      const detail = await ctx.service.bill.detail(id, user_id);
      ctx.body = {
        code: 200,
        msg: '请求成功',
        date: detail,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        date: null,
      };
    }

  }
  async update() {
    const { ctx, app } = this;
    const { id, amount, type_id, type_name, date, pay_type, remark = '' } = ctx.request.body;
    // 判空处理
    if (!amount || !type_id || !type_name || !date || !pay_type) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
    }
    try {
      let user_id;
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      user_id = decode.id;
      const result = await ctx.service.bill.update({
        id, // 账单 id
        amount, // 金额
        type_id, // 消费类型 id
        type_name, // 消费类型名称
        date, // 日期
        pay_type, // 消费类型
        remark, // 备注
        user_id, // 用户 id
      });
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      };
		 } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }
  async delete() {
    const { ctx, app } = this;
    // 获取请求中携带的参数
    const { id } = ctx.request.body;
    // 判空处理
    if (!id) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
    }
    try {

      // 拿到token 获取用户信息
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.id;
      const reuslt = await ctx.service.bill.delete(id, user_id);
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      };


    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '请求失败',
        data: null,
      };

    }


  }
  async data() {
    const { ctx, app } = this;
    const { date = '' } = ctx.query;
    // 获取用户 user_id
    // 。。。
    // 省略鉴权获取用户信息的代码
    try {
      // 获取账单表中的账单数据
      let user_id;
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      user_id = decode.id;
      const result = await ctx.service.bill.list(user_id);
      // 根据时间参数，筛选出当月所有的账单数据
      const start = moment(date).startOf('month').unix() * 1000; // 选择月份，月初时间
      const end = moment(date).endOf('month').unix() * 1000; // 选择月份，月末时间
      const _data = result.filter(item => (Number(item.date) > start && Number(item.date) < end));
      // 总支出
      const total_expense = _data.reduce((arr, cur) => {
        if (cur.pay_type == 1) {
          arr += Number(cur.amount);
        }
        return arr;
      }, 0);
      // 总收入
      const total_income = _data.reduce((arr, cur) => {
        if (cur.pay_type == 2) {
          arr += Number(cur.amount);
        }
        return arr;
      }, 0);
      // 获取收支构成
      let total_data = _data.reduce((arr, cur) => {
        const index = arr.findIndex(item => item.type_id == cur.type_id);
        if (index == -1) {
          arr.push({
            type_id: cur.type_id,
            type_name: cur.type_name,
            pay_type: cur.pay_type,
            number: Number(cur.amount),
          });
        }
        if (index > -1) {
          arr[index].number += Number(cur.amount);
        }
        return arr;
      }, []);

      total_data = total_data.map(item => {
        item.number = Number(Number(item.number).toFixed(2));
        return item;
      });

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          total_expense: Number(total_expense).toFixed(2),
          total_income: Number(total_income).toFixed(2),
          total_data: total_data || [],
        },
      };

    } catch (error) {

      ctx.body = {
        code: 500,
        msg: '请求失败1',
        data: null,
      };
    }
  }
}module.exports = BillController;
