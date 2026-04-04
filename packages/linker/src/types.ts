/**
 * A link definition describing a symbolic link to be created.
 * The Linker resolves src and dest to absolute paths before creating the link.
 */
export type LinkDefinition = {
	/** Unique identifier for this link */
	id: string;
	/** Absolute path to the source (target) of the symlink */
	src: string;
	/** Absolute path to the destination (link location) of the symlink */
	dest: string;
};

/**
 * A resolved symbolic link with the actual absolute paths used.
 * Returned on successful enable to indicate where links were created.
 */
export type ResolvedLink = {
	/** Unique identifier for this link */
	id: string;
	/** Absolute source path */
	src: string;
	/** Absolute destination path */
	dest: string;
};
