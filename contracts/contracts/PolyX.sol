// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PolyX v2 - On-chain social with profiles, media CIDs, follows, edits, deletes, and chat anchoring
/// @notice All critical actions are on-chain; media bytes live on IPFS/Pinata. A relayer can sponsor gas while
///         preserving the logical user address.
contract PolyX {
    enum PostType {
        Original,
        Retweet,
        Quote,
        Comment
    }

    struct Post {
        uint256 id;
        address author; // logical user
        string content;
        string mediaCid; // optional IPFS/Pinata CID
        uint256 timestamp;
        PostType postType;
        uint256 referenceId; // original post for retweet/quote/comment
        uint256 likeCount;
        uint256 retweetCount;
        uint256 quoteCount;
        uint256 commentCount;
        uint256 version;
        bool deleted;
    }

    struct Profile {
        string handle; // unique
        string displayName;
        string bio;
        string avatarCid;
        string headerCid;
        address owner;
        uint256 createdAt;
    }

    uint256 public nextPostId = 1;

    mapping(uint256 => Post) private posts;
    mapping(uint256 => mapping(address => bool)) private likes;
    mapping(uint256 => mapping(address => bool)) private retweeted;
    mapping(uint256 => mapping(address => bool)) private quoted;

    mapping(string => address) private handleToOwner;
    mapping(address => Profile) private profiles;
    mapping(address => address[]) private followingList;
    mapping(address => mapping(address => bool)) private isFollowing;

    event PostCreated(
        uint256 indexed id,
        address indexed author,
        PostType indexed postType,
        uint256 referenceId,
        string content,
        string mediaCid,
        uint256 timestamp
    );
    event PostEdited(uint256 indexed id, address indexed author, string content, string mediaCid, uint256 version);
    event PostDeleted(uint256 indexed id, address indexed author, uint256 timestamp);

    event Liked(uint256 indexed postId, address indexed user, uint256 timestamp);
    event Retweeted(uint256 indexed postId, uint256 indexed originalId, address indexed user, uint256 timestamp);
    event Quoted(
        uint256 indexed postId,
        uint256 indexed originalId,
        address indexed user,
        string content,
        string mediaCid,
        uint256 timestamp
    );
    event Commented(
        uint256 indexed postId,
        uint256 indexed originalId,
        address indexed user,
        string content,
        string mediaCid,
        uint256 timestamp
    );

    event ProfileCreated(address indexed owner, string handle, string displayName);
    event ProfileUpdated(address indexed owner, string handle, string displayName);

    event Followed(address indexed follower, address indexed target);
    event Unfollowed(address indexed follower, address indexed target);

    event ChatAnchored(address indexed from, address indexed to, string cid, string cidHash, uint256 timestamp);

    error EmptyContent();
    error EmptyHandle();
    error HandleTaken();
    error ProfileNotFound();
    error NotAuthor();
    error PostDoesNotExist();
    error AlreadyLiked();
    error AlreadyRetweeted();
    error AlreadyQuoted();
    error AlreadyFollowing();
    error NotFollowing();

    modifier postExists(uint256 postId) {
        if (postId == 0 || postId >= nextPostId) revert PostDoesNotExist();
        _;
    }

    // --- Profile ---
    function createProfile(
        address logicalUser,
        string calldata handle,
        string calldata displayName,
        string calldata bio,
        string calldata avatarCid,
        string calldata headerCid
    ) external {
        if (bytes(handle).length == 0) revert EmptyHandle();
        if (profiles[logicalUser].createdAt != 0) revert HandleTaken(); // already has profile
        if (handleToOwner[handle] != address(0)) revert HandleTaken();

        Profile memory p = Profile({
            handle: handle,
            displayName: displayName,
            bio: bio,
            avatarCid: avatarCid,
            headerCid: headerCid,
            owner: logicalUser,
            createdAt: block.timestamp
        });
        profiles[logicalUser] = p;
        handleToOwner[handle] = logicalUser;
        emit ProfileCreated(logicalUser, handle, displayName);
    }

    function updateProfile(
        address logicalUser,
        string calldata displayName,
        string calldata bio,
        string calldata avatarCid,
        string calldata headerCid
    ) external {
        if (profiles[logicalUser].createdAt == 0) revert ProfileNotFound();
        Profile storage p = profiles[logicalUser];
        p.displayName = displayName;
        p.bio = bio;
        p.avatarCid = avatarCid;
        p.headerCid = headerCid;
        emit ProfileUpdated(logicalUser, p.handle, displayName);
    }

    function getProfileByOwner(address owner) external view returns (Profile memory) {
        if (profiles[owner].createdAt == 0) revert ProfileNotFound();
        return profiles[owner];
    }

    function getProfileByHandle(string calldata handle) external view returns (Profile memory) {
        address owner = handleToOwner[handle];
        if (owner == address(0)) revert ProfileNotFound();
        return profiles[owner];
    }

    function handleAvailable(string calldata handle) external view returns (bool) {
        return handleToOwner[handle] == address(0);
    }

    // --- Follow ---
    function follow(address follower, address target) external {
        if (target == address(0) || follower == target) revert NotFollowing();
        if (isFollowing[follower][target]) revert AlreadyFollowing();
        isFollowing[follower][target] = true;
        followingList[follower].push(target);
        emit Followed(follower, target);
    }

    function unfollow(address follower, address target) external {
        if (!isFollowing[follower][target]) revert NotFollowing();
        isFollowing[follower][target] = false;
        emit Unfollowed(follower, target);
    }

    function isFollowingAddress(address follower, address target) external view returns (bool) {
        return isFollowing[follower][target];
    }

    function getFollowing(address follower) external view returns (address[] memory) {
        return followingList[follower];
    }

    // --- Posts ---
    function createPost(
        address logicalUser,
        string calldata content,
        string calldata mediaCid,
        PostType postType,
        uint256 referenceId
    ) external returns (uint256) {
        if (bytes(content).length == 0 && bytes(mediaCid).length == 0) revert EmptyContent();
        uint256 postId = _writePost(logicalUser, content, mediaCid, postType, referenceId);
        if (postType == PostType.Retweet) {
            retweeted[referenceId][logicalUser] = true;
            posts[referenceId].retweetCount += 1;
            emit Retweeted(postId, referenceId, logicalUser, block.timestamp);
        } else if (postType == PostType.Quote) {
            quoted[referenceId][logicalUser] = true;
            posts[referenceId].quoteCount += 1;
            emit Quoted(postId, referenceId, logicalUser, content, mediaCid, block.timestamp);
        } else if (postType == PostType.Comment) {
            posts[referenceId].commentCount += 1;
            emit Commented(postId, referenceId, logicalUser, content, mediaCid, block.timestamp);
        }
        emit PostCreated(postId, logicalUser, postType, referenceId, content, mediaCid, block.timestamp);
        return postId;
    }

    function like(address logicalUser, uint256 postId) external postExists(postId) {
        if (likes[postId][logicalUser]) revert AlreadyLiked();
        likes[postId][logicalUser] = true;
        posts[postId].likeCount += 1;
        emit Liked(postId, logicalUser, block.timestamp);
    }

    function editPost(
        address logicalUser,
        uint256 postId,
        string calldata content,
        string calldata mediaCid
    ) external postExists(postId) {
        Post storage p = posts[postId];
        if (p.author != logicalUser) revert NotAuthor();
        if (bytes(content).length == 0 && bytes(mediaCid).length == 0) revert EmptyContent();
        p.content = content;
        p.mediaCid = mediaCid;
        p.version += 1;
        emit PostEdited(postId, logicalUser, content, mediaCid, p.version);
    }

    function deletePost(address logicalUser, uint256 postId) external postExists(postId) {
        Post storage p = posts[postId];
        if (p.author != logicalUser) revert NotAuthor();
        p.deleted = true;
        emit PostDeleted(postId, logicalUser, block.timestamp);
    }

    function getPost(uint256 postId) external view postExists(postId) returns (Post memory) {
        return posts[postId];
    }

    function batchGetPosts(uint256[] calldata ids) external view returns (Post[] memory) {
        Post[] memory result = new Post[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == 0 || ids[i] >= nextPostId) {
                revert PostDoesNotExist();
            }
            result[i] = posts[ids[i]];
        }
        return result;
    }

    function hasLiked(uint256 postId, address user) external view postExists(postId) returns (bool) {
        return likes[postId][user];
    }

    function hasRetweeted(uint256 postId, address user) external view postExists(postId) returns (bool) {
        return retweeted[postId][user];
    }

    function hasQuoted(uint256 postId, address user) external view postExists(postId) returns (bool) {
        return quoted[postId][user];
    }

    // --- Chat anchoring ---
    function anchorChatMessage(address logicalUser, address to, string calldata cid, string calldata cidHash) external {
        emit ChatAnchored(logicalUser, to, cid, cidHash, block.timestamp);
    }

    // --- Internal ---
    function _writePost(
        address logicalUser,
        string memory content,
        string memory mediaCid,
        PostType postType,
        uint256 referenceId
    ) internal returns (uint256) {
        if (postType != PostType.Original && referenceId == 0) revert PostDoesNotExist();
        if (postType != PostType.Original && referenceId >= nextPostId) revert PostDoesNotExist();

        uint256 postId = nextPostId++;
        posts[postId] = Post({
            id: postId,
            author: logicalUser,
            content: content,
            mediaCid: mediaCid,
            timestamp: block.timestamp,
            postType: postType,
            referenceId: referenceId,
            likeCount: 0,
            retweetCount: 0,
            quoteCount: 0,
            commentCount: 0,
            version: 0,
            deleted: false
        });
        return postId;
    }
}


