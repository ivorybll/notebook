'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, middleware } = app;
  const _jwt = middleware.jwtErr(app.config.jwt.secret);
  router.get('/', controller.home.index);
  router.get('/user/', controller.home.user);
  router.post('/add', _jwt, controller.home.add);
  router.post('/add_user', controller.home.adduser);
  router.post('/edit_user', controller.home.edituser);
  router.post('/delete_user', controller.home.deleteuser);
  router.post('/api/user/register', controller.user.register);
  router.post('/api/user/login', controller.user.login);
  router.get('/api/user/test', controller.user.test);
  router.post('/api/user/getUserInfo', _jwt, controller.user.getUserInfo);
  router.post('/api/user/editUserInfo', _jwt, controller.user.editUserInfo);
  router.post('/api/upload', controller.upload.upload);
  router.post('/api/bill/add', _jwt, controller.bill.add); // 添加账单
  router.get('/api/bill/list', _jwt, controller.bill.list); // 获取账单列表
  router.get('/api/bill/detail', _jwt, controller.bill.detail); // 获取详情
  router.post('/api/bill/update', _jwt, controller.bill.update); // 账单更新
  router.post('/api/bill/delete', _jwt, controller.bill.delete); // 删除账单
  router.get('/api/bill/data', _jwt, controller.bill.data); // 获取数据
  router.get('/api/type/list', _jwt, controller.type.list); // 获取类型列表
};
