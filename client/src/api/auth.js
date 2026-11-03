const USERS_KEY = 'paripotes_users';
const CURRENT_USER_KEY = 'paripotes_current_user';

export const authAPI = {
  getUsers() {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  },

  saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  userExists(username) {
    const users = this.getUsers();
    return users.some(user => user.username.toLowerCase() === username.toLowerCase());
  },

  register(username, password) {
    if (this.userExists(username)) {
      return { success: false, error: 'Ce pseudo est déjà pris' };
    }

    const users = this.getUsers();
    const newUser = {
      id: Date.now(),
      username,
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);

    this.setCurrentUser(newUser);

    return { success: true };
  },

  login(username, password) {
    const users = this.getUsers();
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (!user) {
      return { success: false, error: 'Pseudo ou mot de passe incorrect' };
    }

    this.setCurrentUser(user);

    return { success: true };
  },

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser() {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  deleteAccount(username) {
    const users = this.getUsers();
    const filteredUsers = users.filter(
      u => u.username.toLowerCase() !== username.toLowerCase()
    );
    this.saveUsers(filteredUsers);
    this.logout();
  },
};
