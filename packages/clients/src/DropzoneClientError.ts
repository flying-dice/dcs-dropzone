export type DropzoneClientErrorProps = {
	message?: string;
	req: Request;
	res: Response;
	data?: any;
	status: number;
};

export class DropzoneClientError extends Error {
	public readonly req: Request;
	public readonly res: Response;
	public readonly data?: any;
	public readonly status: number;

	constructor(props: DropzoneClientErrorProps) {
		super(props.message);
		this.name = "DropzoneClientError";
		this.req = props.req;
		this.res = props.res;
		this.data = props.data;
		this.status = props.status;
	}
}
