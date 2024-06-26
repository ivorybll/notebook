'use strict';
module.exports = secret => {
  return async function jwtErr(ctx, next) {
    const token = ctx.request.header.authorization;
    let decode;
    if (token !== 'null' && token) {
      try {
        decode = await ctx.app.jwt.verify(token, ctx.app.config.jwt.secret);
        await next();
      } catch (error) {
        console.log('error');
        ctx.status = 200;
        ctx.body = {
          msg: 'token已过期，请重新登录',
          code: 401,
        };
        return;


      }
    } else {
      ctx.status = 200;
      ctx.body = {
        code: 401,
        msg: 'token不存在',
      };
      return;
    }
  };
};
