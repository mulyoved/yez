absurd.component('Yez', {
	css: {
		'body, html': {
			wid: '100%', hei: '100%',
			mar: 0, pad: 0,
			// ff: "'Roboto', 'sans-serif'",
			ff: 'Arial',
			fz: '16px', lh: '26px'
		},
		'.left': { fl: 'l' },
		'.right': { fl: 'r' },
		'code': {
			bd: 'solid 1px #D8D8D8',
			pad: '0 2px 0 2px'
		},
		'.clear, .clearfix': {
			clear: 'both'
		},
		'header': {
			bg: '#F3EEE4',
			bdb: 'solid 2px #DFD2B7',
			'.logo': {
				d: 'b', fl: 'l',
				mar: '0 4px 0 10px'
			},
			'&:after': {
				d: 'tb',
				content: '" "',
				clear: 'both'
			}
		},
		hr: {
			bdt: 'none', bdb: 'dotted 1px #999',
			mar: '0 10px'
		}
	},
	host: 'localhost',
	port: 9172,
	connected: false,
	tasks: {},
	connect: function() {
		if(this.connected) { return; }
		var self = this;
		this.socket = io.connect('http://' + this.host + ':' + this.port, {
			'force new connection': true
		});
		this.socket.on('connect', function () {
			self.connected = true;
			self.status.setStatus(true);
			self.nav.visible(true);
			self.content.visible(true);
		});
		this.socket.on('disconnect', function() {
			self.connected = false;
			self.status.setStatus(false);
			self.nav.visible(false);
			self.content.visible(false);
			self.connect();
		});
		this.socket.on('response', function(data) {
			if(self.tasks[data.id]) {
				self.tasks[data.id].response(data);
			}
		});
		setTimeout(function() {
			if(!self.connected) {
				self.connect();
			}
		}, 5000);
	},
	ready: function() {

		var self = this;

		if(window.localStorage) {
			var ts = window.localStorage.getItem('YezTasks');
			if(ts) {
				try {
					ts = JSON.parse(ts);
					for(var i=0; i<ts.length; i++) {
						var t = this.createTask(ts[i]);
						this.tasks[t.id] = t;
					}
				} catch(err) {

				}
			}
		}

		this.populate();

		this.status = Status(this.host, this.port);
		this.nav = Nav();
		this.content = Content();
		this.home = Home();

		this.nav.on('new', function() {
			self.content.append(self.createTask())
		});

		this.home.on('show-task', function(id) {
			if(self.tasks[id]) {
				self.content.append(self.tasks[id]);
			}
		});
		this.home.on('show-and-run-task', function(id) {
			if(self.tasks[id]) {
				self.content.append(self.tasks[id]);
				self.tasks[id].startTasks();
			}
		});

		this.connect();
		this.content.append(this.home.setTasks(this.tasks));

	},
	createTask: function(data) {
		var t = Task(data);
		t.on('data', function(data) {
			delete data.target;
			if(this.socket && this.connected) {
				this.socket.emit('data', data);
			} else {
				t.response({ action: 'error', msg: 'No back-end!' });
			}
		}.bind(this));
		t.on('save', function() {
			this.tasks[t.id] = t;
			this.saveToStorage();
		}.bind(this));
		t.on('home', function() {
			this.showHome();
		}.bind(this));
		t.on('delete-task', function() {
			delete this.tasks[t.id];
			this.showHome().saveToStorage();
		}.bind(this));
		return t;
	},
	showHome: function() {
		this.content.append(this.home.setTasks(this.tasks));
		return this;
	},
	saveToStorage: function() {
		var tasks = [];
		for(var id in this.tasks) {
			tasks.push(this.tasks[id].data);
		}
		if(window.localStorage) {
			window.localStorage.setItem('YezTasks', JSON.stringify(tasks));
		}
	}
})();