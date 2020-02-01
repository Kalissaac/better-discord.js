'use strict';

const DataStore = require('./DataStore');
const User = require('../structures/User');
const GuildMember = require('../structures/GuildMember');
const Message = require('../structures/Message');

/**
 * A data store to store User models.
 * @extends {DataStore}
 */
class UserStore extends DataStore {
  constructor(client, iterable) {
    super(client, iterable, User);
  }

  /**
   * Data that resolves to give a User object. This can be:
   * * A User object
   * * A Snowflake
   * * A string in the form of Username#Discriminator
   * * A Message object (resolves to the message author)
   * * A GuildMember object
   * @typedef {User|Snowflake|string|Message|GuildMember} UserResolvable
   */

  /**
   * Resolves a UserResolvable to a User object.
   * @param {UserResolvable} user The UserResolvable to identify
   * @returns {?User}
   */
  resolve(user) {
    if (user instanceof GuildMember) return user.user;
    if (user instanceof Message) return user.author;
    if (typeof user === 'string' && user.includes('#')) {
      return this.find(u => `${u.username}#${u.discriminator}` === user) || null;
    }
    return super.resolve(user);
  }

  /**
   * Resolves a UserResolvable to a user ID string.
   * @param {UserResolvable} user The UserResolvable to identify
   * @returns {?Snowflake}
   */
  resolveID(user) {
    if (user instanceof GuildMember) return user.user.id;
    if (user instanceof Message) return user.author.id;
    if (typeof user === 'string' && user.includes('#')) {
      return this.find(u => `${u.username}#${u.discriminator}` === user).id || null;
    }
    return super.resolveID(user);
  }

  /**
   * Obtains a user from Discord, or the user cache if it's already available.
   * @param {Snowflake} id ID of the user
   * @param {boolean} [cache=true] Whether to cache the new user object if it isn't already
   * @returns {Promise<User>}
   */
  async fetch(id, cache = true) {
    const existing = this.get(id);
    if (existing && !existing.partial) return existing;
    const data = await this.client.api.users(id).get();
    return this.add(data, cache);
  }

  add(data, channel, cache = true) {
    if (typeof channel === 'boolean') {
      cache = channel;
      channel = undefined;
    }
    const user = super.add(data, cache);
    if (channel) channel.recipients.add(user);
    return user;
  }
}

module.exports = UserStore;
