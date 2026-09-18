<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Serves the Svelte SPA (built files in /spa).
 */
class App extends CI_Controller
{
	public function index()
	{
		$index = FCPATH . 'spa/index.html';

		if (!is_file($index)) {
			show_error(
				'Svelte build not found. Run: cd frontend && npm install && npm run build',
				503,
				'Frontend not built'
			);
			return;
		}

		$this->output
			->set_content_type('text/html', 'utf-8')
			->set_output(file_get_contents($index));
	}
}
