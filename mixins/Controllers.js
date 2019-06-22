/**
 * Use Class Methods as API Controllers
 *
 * controller routes followed by document name
 * Ex;
 *  /api/{document_name}/{route_name}
 *
 */

const express = require('express');
const _unionBy = require('lodash/unionBy');
const _isPlainObject = require('lodash/isPlainObject');

const Middlewares = require('../base/Middlewares');
const response = require('../base/Response');

const Controllers = ClassName => class extends ClassName {
  /**
   * ===================================
   *        Public Methods
   * ===================================
   */

  /**
   * Retrun document controllers
   *
   * Controller Object
   * {
   *  type: 'post/get/..' ( Default: post ),
   *  function: controller function binded with current document,
   *  route: 'myRoute',
   *  middlewares: list of middleware functions
   *  auth: true/fasle ( Default: true ) authenticate user before call
   * }
   *
   * function have 4 arguments
   *  -> value (req.body)
   *  -> context (user info)
   *  -> req (express request object)
   *  -> res (express response object)
   *  -> next (express next function)
   */
  controllers() {
    return [];
  }

  /**
   * return document conttollers and register in express route
   *
   */
  getControllers() {
    const self = this;
    const controllers = this.controllers();
    const router = express.Router();
    controllers.forEach((controller) => {
      const {
        type = 'post',
        route,
        method,
        params = [],
        auth = true,
        middlewares = [],
        version = 1,
      } = controller;

      if (auth) {
        middlewares.unshift(Middlewares.auth);
      } else {
        middlewares.unshift(Middlewares.user);
      }

      if (params.length) {
        middlewares.push(Middlewares.hasData(params));
      }

      router[type](`/v${version}${route}`, ...middlewares, async function (req, res, next) {
        const value = req.body || {};
        const context = {
          user: req.user || {},
          sudo: false,
        };
        try {
          let responceData = method.call(self, value, context, req, res, next);
          if (responceData instanceof Promise) {
            responceData = await responceData;
          }
          if (_isPlainObject(responceData) && responceData.__redirect) {
            res.redirect(responceData.__redirect);
          } else {
            res.json(response.data(responceData));
          }
        } catch (error) {
          res.json(response.error(error));
        }
      });
    });
    return router;
  }

  /**
   * override controller
   *
   * @param {list} controllers
   * @param {list} override
   */
  overrideControllers(controllers, override) {
    return _unionBy(override, controllers, 'route');
  }

  /**
   * add sudo true in context
   *
   * @param {Object} context
   */
  sudoContext(context) {
    return Object.assign({}, context, { sudo: true });
  }
};

module.exports = Controllers;
