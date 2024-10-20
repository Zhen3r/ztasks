// import logo from './logo.svg';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
// import tasks from "./sampleData";
import { Modal, Button, Form, FormLabel, Collapse } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import * as req from './req';



const col_class_name = "todocol col align-items-center d-flex justify-content-center text-center";
function App() {
  const [tasks, setTasks] = useState([]);
  const [login, setLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    req.getTasks().then((data) => {
      setTasks(data);
    });
  }, []);


  const handleLogin = (e) => {
    e.preventDefault();
    req.login(email, password).then((data) => {
      console.log('Login successful', data);
      setLogin(true);
      localStorage.setItem('token', data.token);
    }).catch((error) => {
      console.error(error);
      window.alert('Login failed');
    });
  };

  if (!login) {
    return (
      <div>
        <header className="navbar navbar-expand-lg ">
          <div className="container d-flex justify-content-between align-items-center ">
            <div className="navbar-brand">
              <span>Z</span>
              <span className='text-secondary'>Tasks</span>
            </div>
            <div className="d-flex justify-content-end gap-2">
            </div>
          </div>
        </header>
        <div className="container-sm d-flex justify-content-center align-items-center">
          <div className="col-4 text-center mt-5">
            <h1>Welcome to ZTasks</h1>
            <p className="text-secondary">Please login to continue</p>

            <Form className="mt-5 ">
              <Form.Group controlId="formEmail" className='form-floating mb-3'>
                <Form.Control
                  type="email"
                  placeholder="name@example.com"
                  required
                  autoFocus
                  autoComplete='off'
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Form.Label>Email</Form.Label>
              </Form.Group>

              <Form.Group controlId="formPassword" className='form-floating mb-3'>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  required
                  autoComplete='off'
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Form.Label>Password</Form.Label>
              </Form.Group>

              <Button variant="primary" type="submit" className="btn w-100 mt-3" onClick={handleLogin}>
                Login
              </Button>
            </Form>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div>
      <header className="navbar navbar-expand-lg ">
        <div className="container d-flex justify-content-between align-items-center ">
          <div className="navbar-brand">
            <span>Z</span>
            <span className='text-secondary'>Tasks</span>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <div className="btn btn-sm btn-outline-secondary">History</div>
            <NewTaskModal tasks={tasks} setTasks={setTasks} />
          </div>
        </div>
      </header>
      <div className="container-sm">
        <TodoStatus tasks={tasks} setTasks={setTasks} />
      </div>
    </div>
  );
}

const TodoStatus = ({tasks, setTasks}) => {
  const [statsOpenList, setStatsOpenList] = useState(Array(tasks.length).fill(false));

  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    return date;
  });
  const dateColumns = dates.map(date => {
    const day_of_week = date.toLocaleString('en-us', {weekday: 'short'});
    return <div className={col_class_name + " lh-1"}><span>{date.getDate()}<br /><span className="badge">{day_of_week}</span></span></div>;
  });

  let res = [];
  tasks.map(task => {
    const statsOpen = statsOpenList[tasks.indexOf(task)];
    const setStatsOpen = (value) => {
      let new_statsOpenList = statsOpenList.map((_) => false);
      new_statsOpenList[tasks.indexOf(task)] = value;
      setStatsOpenList(new_statsOpenList);
    };

    const onClickTaskName = () => {
      setStatsOpen(!statsOpen);
    };

    let row = [<TaskName task={task} tasks={tasks} setTasks={setTasks} onClick={onClickTaskName} />];
    row.push(<div className='vr bg-transparent'></div>)
    for (let date of dates) {
      row.push(<TaskStatus task={task} date={date} />);
    }
    res.push(
      <>
        <div className="row pt-2 pb-2 border-top flex-nowrap">{row}</div>
        <StatsCollapse task={task} open={statsOpen} setOpen={setStatsOpen} />
      </>
    );
  });
      

  return (
    <div className="overflow-x-scroll">
      <div className="todo-container mt-3 flex-nowrap">
        <div className="row pb-2 flex-nowrap">
          <TaskName/>
          <div className="vr bg-transparent"></div>
          {dateColumns}
        </div>
        {res}
      </div>
    </div>
  );
};

const StatsCollapse = ({ task, open, setOpen }) => {
  return (
    <Collapse in={open}>
      <div className="overflow-visible">
          <div className='card position-sticky start-0' style={{width: '80vw', left: "10vw", minWidth: '400px'}}>
          <div className="m-3">
              <div className="row">123123123</div>
              <div className="d-flex justify-content-between">
                <div className="btn btn-sm btn-outline-secondary">Edit</div>
                <div className="btn btn-sm btn-outline-secondary">Delete</div>
              </div>
            </div>
          </div>
      </div>
    </Collapse>
  );
};


const TaskName = ({task, tasks, setTasks, onClick}) => {
  return (
    <div className={"todocol-task border-end " + col_class_name}>
      {/* {task? <EditTaskModal task={task} tasks={tasks} setTasks={setTasks} /> : <span>Task</span>} */}
      {/* {task? task.name : <span>Task</span>} */}
      {task? <div className="btn" onClick={onClick}>{task.name}</div> : <span>Task</span>}
    </div>
  );
};

const TaskStatus = ({ task, date }) => {
  const [show, setShow] = useState(false);
  const [new_status, setStatus] = useState("true");
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ task, status });
    let parsed_status = new_status;
    parsed_status = parsed_status.trim();
    parsed_status = parsed_status.toLowerCase();
    if (task.type === 'number') {
      console.log(parsed_status);
      if (status === 'true') {
        parsed_status = null;
      } else {
        parsed_status = parseFloat(parsed_status);
        if (isNaN(parsed_status)) {
          handleClose();
          return;
        }
        if (Number.isInteger(parsed_status)) {
          parsed_status = parseInt(parsed_status);
        } else {
          parsed_status = parsed_status.toFixed(2);
        }
      }
    }
    task.status[date.toISOString().split('T')[0]] = parsed_status;
    req.updateTaskStatus(task.id, date.toISOString().split('T')[0], parsed_status);
    handleClose();
  };


  let dateiso = date.toISOString().split('T')[0];
  let task_type = task.type? task.type : 'number';
  let possible_status;
  let status = task.status[dateiso];
  let res;
  let form;

  if (task_type === 'number') {
    possible_status = 'number (' + task.unit + ')';
    form = (
      <Form.Control
        type="number"
        onChange={(e) => setStatus(e.target.value)}
        placeholder={status ? status : possible_status}
        autoComplete='off'
        autoFocus
      />
    );
  } else if (task_type === 'bool') {
    form = (
      <Form.Control
        as="select"
        onChange={(e) => setStatus(e.target.value)}
        placeholder="true"
        autoComplete='off'
        autoFocus
      >
        <option value="true">Done</option>
        <option value="false">Not Done</option>
        <option value="skip">Skip</option>
      </Form.Control>
    );
  } else {
    throw new Error('Invalid task type');
  }


  if (status === undefined || status === null) {
    res = TaskStatusNull(status);
  } else if (task_type === 'number') {
    if (status === 0) {
      res = TaskStatusNull(status);
    } else {
      let ttl = task.goal_each_period / task.tracking_period_days;
      res = TaskStatusNumber(status, ttl);
    }
  } else if (task_type === 'bool') {
    res = TaskStatusBool(status);
  } else {
    throw new Error('Invalid task type');
  }
  return (
    <>
      <div className={col_class_name + " btn"} onClick={handleShow}>
        {res}
      </div>
      <Modal show={show} onHide={handleClose}>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formStatus" className='form-floating'>
              {form}
              <Form.Label><small>{task.name}, {date.toISOString().split('T')[0]}</small></Form.Label>
            </Form.Group>

            <Button variant="primary" type="submit" className="btn-sm mt-3">
              Save
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

const TaskStatusNumber = (status, ttl) => {
  return (
    <>
      <SvgProgressCircle progress={status} ttl={ttl}/>
      <small className="">{status}</small>
    </>
  );
}
const TaskStatusNull = (status) => {
  return (
    <i class="bi bi-x text-secondary"></i>
  );
}
const TaskStatusBool = (status) => {
  if (status === "true") {
    return (
      <i class="bi bi-check-lg"></i>
    );
  } else if (status === "skip") {
    return (
      <i class="bi bi-chevron-bar-right"></i>
    )
  } else {
    return (
      <i class="bi bi-x text-secondary"></i>
    );
  }
}

const TaskModal = ({handleSubmit, taskName, setTaskName, taskType, setTaskType, trackingPeriodDays, setTrackingPeriodDays, goalEachPeriod, setGoalEachPeriod, unit, setUnit, show, setShow, handleClose, handleShow, handleDelete, type}) => {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Body className='p-3'>
        <Form onSubmit={handleSubmit}>
          <p className='h6 mb-3'>{type=="new"? "New Task": "Change Task"}</p>
          <Form.Group controlId="formTaskName" className='form-floating mb-3'>
            <Form.Control
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
              required
              autoFocus
              autoComplete='off'
            />
            <FormLabel>Task Name</FormLabel>
          </Form.Group>

          <Form.Group controlId="formTaskType" className='form-floating mb-3'>
            <Form.Control
              as="select"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
            >
              <option value="number">Number</option>
              <option value="bool">Boolean</option>
            </Form.Control>
            <Form.Label>Task Type</Form.Label>
          </Form.Group>

          <Form.Group controlId="formTrackingPeriodDays" className='form-floating mb-3'>
            <Form.Control
              type="number"
              value={trackingPeriodDays}
              onChange={(e) => setTrackingPeriodDays(e.target.value)}
              placeholder="Enter tracking period (days)"
            />
            <Form.Label>Tracking Period (days)</Form.Label>
          </Form.Group>

          <Form.Group controlId="formGoalEachPeriod" className='form-floating mb-3'>
            <Form.Control
              type="number"
              value={goalEachPeriod}
              onChange={(e) => setGoalEachPeriod(e.target.value)}
              placeholder="Enter goal in each period"
            />
            <Form.Label>Goal in Each Period</Form.Label>
          </Form.Group>

          <Form.Group controlId="formUnit" className='form-floating mb-3'>
            <Form.Control
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Enter unit"
            />
            <Form.Label>Unit</Form.Label>
          </Form.Group>

          <div className="d-flex justify-content-between ">
            {handleDelete && <Button variant="danger" onClick={handleDelete} className="btn-sm ">Delete</Button>}
            <Button variant="primary" type="submit" className="btn-sm w-25"> Save </Button>
          </div>

        </Form>
      </Modal.Body>
    </Modal>
  );
}

const NewTaskModal = ({tasks, setTasks}) => {
  const [taskName, setTaskName] = useState("");
  const [taskType, setTaskType] = useState("number");
  const [trackingPeriodDays, setTrackingPeriodDays] = useState(7);
  const [goalEachPeriod, setGoalEachPeriod] = useState(30);
  const [unit, setUnit] = useState("minutes");
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => {
    setShow(true)
    setTaskName('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let new_task;
    req.createTask({
      name: taskName,
      type: taskType,
      tracking_period_days: trackingPeriodDays,
      goal_each_period: goalEachPeriod,
      unit: unit,
    }).then((data) => {
      new_task = data;
      console.log(new_task);
      setTasks([...tasks, new_task]);
      handleClose();
    });
  }

  return (
    <>
      <div className="btn btn-sm btn-outline-secondary" onClick={handleShow}>New</div>
      {TaskModal({ handleSubmit, taskName, setTaskName, taskType, setTaskType, trackingPeriodDays, setTrackingPeriodDays, goalEachPeriod, setGoalEachPeriod, unit, setUnit, show, setShow, handleClose, handleShow })}
    </>
  );
}

const EditTaskModal = ({task, tasks, setTasks}) => {
  const [taskName, setTaskName] = useState(task.name);
  const [taskType, setTaskType] = useState(task.type);
  const [trackingPeriodDays, setTrackingPeriodDays] = useState(task.tracking_period_days);
  const [goalEachPeriod, setGoalEachPeriod] = useState(task.goal_each_period);
  const [unit, setUnit] = useState(task.unit);

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => {
    setShow(true)
  };

  let task_id = task.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    req.updateTask(task_id, {
      name: taskName,
      type: taskType,
      tracking_period_days: trackingPeriodDays,
      goal_each_period: goalEachPeriod,
      unit: unit,
    }).then((data) => {
      let new_tasks;
      new_tasks = tasks.map((t) => {
        if (t.id === task_id) {
          return data;
        }
        return t;
      });
      console.log(data);
      setTasks(new_tasks);
      handleClose();
    });
  }

  const handleDelete = (e) => {
    e.preventDefault();
    req.deleteTask(task_id).then((data) => {
      let new_tasks = tasks.filter((t) => t.id !== task_id);
      setTasks(new_tasks);
      handleClose();
    });
  };
      

  // let modal = TaskModal({handleSubmit, taskName, setTaskName, taskType, setTaskType, trackingPeriodDays, setTrackingPeriodDays, goalEachPeriod, setGoalEachPeriod, unit, setUnit, show, setShow, handleClose, handleShow});
  return (
    <>
      <div className="btn" onClick={handleShow}>{taskName}</div>
      <TaskModal handleSubmit={handleSubmit} taskName={taskName} setTaskName={setTaskName} taskType={taskType} setTaskType={setTaskType} trackingPeriodDays={trackingPeriodDays} setTrackingPeriodDays={setTrackingPeriodDays} goalEachPeriod={goalEachPeriod} setGoalEachPeriod={setGoalEachPeriod} unit={unit} setUnit={setUnit} show={show} setShow={setShow} handleClose={handleClose} handleShow={handleShow} handleDelete={handleDelete} />
    </>
  );
}
  

const SvgProgressCircle = ({ progress, ttl=100, color="white" }) => {
  progress /= ttl;
  progress = Math.min(progress, 1);
  progress = Math.max(progress, 0);
  const radius = 12;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress  * circumference;
  return (
    <svg
      height={radius * 2}
      width={radius * 2}
    >
      <circle
        className='progress-bg'
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        className='progress-main'
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + ' ' + circumference}
        style={{ strokeDashoffset }}
        transform={`rotate(-90 ${radius} ${radius})`}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
}
      


export default App;
