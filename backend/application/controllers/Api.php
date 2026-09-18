<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Api extends CI_Controller
{
	public function __construct()
	{
		parent::__construct();
		$this->_cors();
	}

	public function options()
	{
		$this->output->set_status_header(204);
	}

	public function dashboard()
	{
		$tasks = $this->_tasks();
		$counts = array(
			'total' => count($tasks),
			'open' => 0,
			'in_progress' => 0,
			'done' => 0,
		);

		foreach ($tasks as $task) {
			if (isset($counts[$task['status']])) {
				$counts[$task['status']]++;
			}
		}

		$this->_json(array(
			'success' => true,
			'data' => $counts,
		));
	}

	public function tasks()
	{
		$tasks = $this->_tasks();
		$status = $this->input->get('status', true);
		$q = $this->input->get('q', true);

		if ($status !== null && $status !== '') {
			$tasks = array_values(array_filter($tasks, function ($task) use ($status) {
				return $task['status'] === $status;
			}));
		}

		if ($q !== null && $q !== '') {
			$needle = strtolower($q);
			$tasks = array_values(array_filter($tasks, function ($task) use ($needle) {
				$haystack = strtolower(
					$task['title'] . ' ' . $task['description'] . ' ' . $task['pic']
				);
				return strpos($haystack, $needle) !== false;
			}));
		}

		$this->_json(array(
			'success' => true,
			'data' => $tasks,
		));
	}

	public function task($id = null)
	{
		$id = (int) $id;
		if ($id < 1) {
			return $this->_json(array(
				'success' => false,
				'message' => 'Invalid task id',
			), 400);
		}

		foreach ($this->_tasks() as $task) {
			if ((int) $task['id'] === $id) {
				return $this->_json(array(
					'success' => true,
					'data' => $task,
				));
			}
		}

		$this->_json(array(
			'success' => false,
			'message' => 'Task not found',
		), 404);
	}

	private function _tasks()
	{
		$path = APPPATH . 'data/tasks.php';
		if (!is_file($path)) {
			return array();
		}

		$data = include $path;
		return is_array($data) ? $data : array();
	}

	private function _json($payload, $status = 200)
	{
		$this->output
			->set_status_header($status)
			->set_content_type('application/json', 'utf-8')
			->set_output(json_encode($payload));
	}

	private function _cors()
	{
		header('Access-Control-Allow-Origin: *');
		header('Access-Control-Allow-Methods: GET, OPTIONS');
		header('Access-Control-Allow-Headers: Content-Type, Accept');

		if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
			$this->output->set_status_header(204);
			exit;
		}
	}
}
