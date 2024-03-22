'use strict';
const Controller = require('egg').Controller;
const defaultAvatar = 'http://s.yezgea02.com/1615973940679/WeChat77d6d2ac093e247c361f0b8a7aeb6c2a.png';
class UserController extends Controller {
  async register() {
    const { ctx } = this;
    const { username, password } = ctx.request.body;
    if (!username || !password) {
      ctx.body = {
        code: 500,
        msg: '账号密码错误',
        date: null,
      };
      return;
    }
    // 验证数据库内是否已经有该用户名了
    const userInfo = await ctx.service.user.getUserByName(username);
    if (userInfo && userInfo.id) {
      ctx.body = {
        code: 500,
        msg: '账户用户名已经存在',
        data: null,
      };
      return;
    }
    // 默认头像

    const result = await ctx.service.user.register({
      username,
      password,
      signature: '世界和平',
      avatar: defaultAvatar,
      ctime: new Date(),
    });
    if (result) {
      ctx.body = {
        code: 200,
        msg: '注册成功',
        data: null,
      };
    } else {
      ctx.body = {
        code: 500,
        msg: '注册失败',
        data: null,
      };
    }

  }
  async login() {
    // app为全局属性，相当于所有的插件方法都植入到了app对象
    const { ctx, app } = this;
    const { username, password } = ctx.request.body;
    // 验证数据库内是否已经有该用户名了
    const userInfo = await ctx.service.user.getUserByName(username);
    if (!userInfo || !userInfo.id) {
      ctx.body = {
        code: 500,
        msg: '账户不存在',
        data: null,
      };
      return;
    }
    // 找到用户验证密码
    if (userInfo && password !== userInfo.password) {
      ctx.body = {
        code: 500,
        msg: '账号密码错误',
        data: null,
      };
      return;
    }
    const token = app.jwt.sign({
      id: userInfo.id,
      username: userInfo.username,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // token有效期

    }, app.config.jwt.secret);
    ctx.body = {
      code: 200,
      message: '登录成功',
      data: {
        token,
      },
    };


  }
  // 验证接口
  async test() {
    const { ctx, app } = this;
    // 通过 token 解析，拿到 user_id
    const token = ctx.request.header.authorization;
    // 通过 app.jwt.verify + 加密字符串 解析出 token 的值
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    // 响应接口
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: {
        ...decode,
      },
    };

  }
  async getUserInfo() {
    const { ctx, app } = this;
    // 通过 token 解析，拿到 user_id
    const token = ctx.request.header.authorization;
    // 通过 app.jwt.verify + 加密字符串 解析出 token 的值
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    const userInfo = await ctx.service.user.getUserByName(decode.username);
    ctx.body = {
      code: 200,
      msg: '请求成功',
      data: {
        id: userInfo.id,
        username: userInfo.username,
        signature: userInfo.signature || '',
        avatar: userInfo.avatar || defaultAvatar,
      },
    };

  }
  async editUserInfo() {
    const { ctx, app } = this;
    // 通过post请求，在请求体中获取签名字段 signature
    const { signature = '', avatar = '' } = ctx.request.body;

    try {
      let user_id = '';
      const token = ctx.request.header.authorization;
      // 通过 app.jwt.verify + 加密字符串 解析出 token 的值
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      user_id = decode.id;
      const userInfo = await ctx.service.user.getUserByName(decode.username);
      const result = await ctx.service.user.editUserInfo({
        ...userInfo,
        signature,
        avatar,
      });
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          id: user_id,
          signature,
          username: userInfo.username,
          avatar,
        },
      };
    } catch (error) {
      console.log(error);
      return null;
    }

  }
}
module.exports = UserController;
